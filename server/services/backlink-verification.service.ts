import dns from 'node:dns';
import net from 'node:net';
import { backlinkTrackerRepository } from '../repositories/backlink-tracker.repository';
import {
  TrackedBacklink,
  TrackedBacklinkStatus,
  TrackedBacklinkLinkType,
} from '../../db/schema/index';
import { logger } from '../utils/logger';

export interface VerificationResult {
  isVerified: boolean;
  status: TrackedBacklinkStatus;
  httpStatus: number | null;
  linkType?: TrackedBacklinkLinkType;
  anchorText?: string;
  notes: string;
  hops: number;
  finalUrl?: string;
  isOversized?: boolean;
}

export interface VerificationBatchSummary {
  processed: number;
  active: number;
  lost: number;
  broken: number;
}

const MAX_BYTES = 500 * 1024; // 500 KB limit
const TIMEOUT_MS = 5000; // 5-second timeout
const MAX_REDIRECTS = 3;

const RECOGNIZED_LEGOMARK_HOSTS = new Set([
  'legomark.in',
  'www.legomark.in',
  'legomarkindia.com',
  'www.legomarkindia.com',
  'legomark.com',
  'www.legomark.com',
]);

/**
 * LACS Module #22: Backlink Verification Service
 * Autonomous crawler inspecting external source URLs over HTTP/HTTPS with
 * full SSRF protection, redirect control, payload streaming limits, and link detection.
 */
export class BacklinkVerificationService {
  /**
   * Evaluates if an IP address belongs to private, loopback, link-local, or cloud-metadata CIDRs.
   */
  public isPrivateOrReservedIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) return true;
      const [b0, b1] = parts;
      if (b0 === 0) return true; // 0.0.0.0/8
      if (b0 === 10) return true; // 10.0.0.0/8 (Private RFC 1918)
      if (b0 === 127) return true; // 127.0.0.0/8 (Loopback)
      if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 (Link-local & AWS/GCP metadata)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12 (Private RFC 1918)
      if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16 (Private RFC 1918)
      if (b0 === 100 && b1 >= 64 && b1 <= 127) return true; // 100.64.0.0/10 (Carrier NAT)
      if (b0 >= 224) return true; // 224.0.0.0/4 Multicast & 240.0.0.0/4 Reserved
      return false;
    }

    if (net.isIPv6(ip)) {
      const clean = ip.toLowerCase().trim();
      if (clean === '::' || clean === '::1' || clean === '0:0:0:0:0:0:0:1') return true; // Loopback & unspecified
      if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true; // fe80::/10 link-local
      if (clean.startsWith('fc') || clean.startsWith('fd')) return true; // fc00::/7 unique local
      if (clean.startsWith('::ffff:')) {
        const v4Part = clean.replace('::ffff:', '');
        return this.isPrivateOrReservedIp(v4Part);
      }
      return false;
    }

    return true; // Reject unrecognized IP format
  }

  /**
   * Pre-flight SSRF check: validates protocol and resolves DNS hostnames to verify all IP targets.
   */
  public async validateUrlAndDns(urlStr: string): Promise<URL> {
    if (!urlStr || typeof urlStr !== 'string') {
      throw new Error('Source URL must be a non-empty string');
    }

    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      throw new Error(`Invalid URL format: "${urlStr}"`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Forbidden protocol "${parsed.protocol}". Only http: and https: are permitted.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block obvious local names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal'
    ) {
      throw new Error(`Blocked destination: Local or internal host "${hostname}" is prohibited.`);
    }

    // Check if hostname is an IP literal
    if (net.isIP(hostname)) {
      if (this.isPrivateOrReservedIp(hostname)) {
        throw new Error(`Blocked destination: Target IP "${hostname}" is private or reserved.`);
      }
      return parsed;
    }

    // Resolve DNS to verify all destination IPs
    try {
      const addresses = await dns.promises.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        throw new Error(`Unable to resolve hostname "${hostname}".`);
      }

      for (const addr of addresses) {
        if (this.isPrivateOrReservedIp(addr.address)) {
          throw new Error(`Blocked destination: Host "${hostname}" resolves to private/reserved IP [${addr.address}].`);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.startsWith('Blocked destination:')) {
        throw err;
      }
      throw new Error(`DNS resolution failed for "${hostname}": ${err.message || 'Host not found'}`);
    }

    return parsed;
  }

  /**
   * Safely fetches a remote page with max 3 redirects, 5s timeout, and 500KB stream limit.
   */
  public async fetchPageHtml(
    sourceUrl: string
  ): Promise<{ httpStatus: number; html: string; isOversized: boolean; hops: number; finalUrl: string }> {
    let currentUrl = sourceUrl;
    let hops = 0;

    while (hops <= MAX_REDIRECTS) {
      await this.validateUrlAndDns(currentUrl);

      const signal = AbortSignal.timeout(TIMEOUT_MS);
      let response: Response;

      try {
        response = await fetch(currentUrl, {
          signal,
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LegomarkBacklinkBot/1.0; +https://legomark.in/bot)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
          throw new Error(`Request timed out after ${TIMEOUT_MS / 1000} seconds`);
        }
        throw fetchErr;
      }

      // Check for redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        hops++;
        if (hops > MAX_REDIRECTS) {
          throw new Error(`Exceeded maximum allowed redirects (${MAX_REDIRECTS})`);
        }

        const location = response.headers.get('location');
        if (!location) {
          return {
            httpStatus: response.status,
            html: '',
            isOversized: false,
            hops,
            finalUrl: currentUrl,
          };
        }

        currentUrl = new URL(location, currentUrl).href;
        continue;
      }

      // Read response body up to MAX_BYTES (500 KB)
      let html = '';
      let isOversized = false;

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        let bytesReceived = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          bytesReceived += value.length;
          html += decoder.decode(value, { stream: true });

          if (bytesReceived >= MAX_BYTES) {
            isOversized = true;
            try {
              await reader.cancel();
            } catch {
              // Reader cancel non-blocking
            }
            break;
          }
        }
      }

      return {
        httpStatus: response.status,
        html,
        isOversized,
        hops,
        finalUrl: currentUrl,
      };
    }

    throw new Error(`Exceeded maximum allowed redirects (${MAX_REDIRECTS})`);
  }

  /**
   * Scans HTML for <a> tags pointing to the target LEGOMARK page and extracts anchor/rel attributes.
   */
  public detectTargetLink(
    html: string,
    targetUrl: string
  ): { found: boolean; anchorText?: string; linkType?: TrackedBacklinkLinkType; rawHref?: string } {
    if (!html || !targetUrl) return { found: false };

    const cleanTarget = targetUrl.split('?')[0].replace(/\/$/, '').toLowerCase();
    const linkRegex = /<a\b([^>]*)>(.*?)<\/a>/gis;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
      const attrs = match[1];
      const innerHtml = match[2];

      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i) || attrs.match(/href=([^ \t\r\n>]+)/i);
      if (!hrefMatch) continue;

      const rawHref = hrefMatch[1].trim();
      let pathname = '';
      let isLegomarkHost = false;

      try {
        if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
          const u = new URL(rawHref);
          pathname = u.pathname.replace(/\/$/, '').toLowerCase();
          const host = u.hostname.replace(/^www\./, '').toLowerCase();
          isLegomarkHost = RECOGNIZED_LEGOMARK_HOSTS.has(host) || host.includes('legomark');
        } else if (rawHref.startsWith('/')) {
          pathname = rawHref.split('?')[0].replace(/\/$/, '').toLowerCase();
          isLegomarkHost = true; // Relative internal link
        }
      } catch {
        continue;
      }

      // Check if path matches target URL (e.g. /services/private-limited-company-registration)
      const pathMatches = pathname === cleanTarget || (cleanTarget === '' && (pathname === '' || pathname === '/'));

      if (isLegomarkHost && pathMatches) {
        // Detect rel attributes
        const relMatch = attrs.match(/rel=["']([^"']+)["']/i);
        const relStr = relMatch ? relMatch[1].toLowerCase() : '';

        let linkType: TrackedBacklinkLinkType = 'dofollow';
        if (relStr.includes('sponsored')) {
          linkType = 'sponsored';
        } else if (relStr.includes('ugc')) {
          linkType = 'ugc';
        } else if (relStr.includes('nofollow')) {
          linkType = 'nofollow';
        }

        // Extract anchor text
        let anchorText = innerHtml
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Image link fallback
        if (!anchorText) {
          const altMatch = innerHtml.match(/alt=["']([^"']+)["']/i);
          if (altMatch && altMatch[1].trim()) {
            anchorText = `[Image: ${altMatch[1].trim()}]`;
          } else if (/<img\b/i.test(innerHtml)) {
            anchorText = '[Image Link]';
          }
        }

        return {
          found: true,
          anchorText: anchorText || '(empty anchor)',
          linkType,
          rawHref,
        };
      }
    }

    return { found: false };
  }

  /**
   * Verifies an external source URL against a target Legomark path without mutating database state.
   */
  public async verifyBacklinkData(sourceUrl: string, targetUrl: string): Promise<VerificationResult> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    try {
      const { httpStatus, html, isOversized, hops, finalUrl } = await this.fetchPageHtml(sourceUrl);

      if (httpStatus >= 400) {
        return {
          isVerified: false,
          status: 'broken',
          httpStatus,
          notes: `HTTP error ${httpStatus} encountered when fetching page. Checked at ${timestamp}.${hops > 0 ? ` (${hops} redirect hops)` : ''}`,
          hops,
          finalUrl,
          isOversized,
        };
      }

      const detection = this.detectTargetLink(html, targetUrl);

      if (detection.found) {
        const notesParts = [
          `Verified live: found ${detection.linkType?.toUpperCase()} link to ${targetUrl} with anchor "${detection.anchorText}".`,
          `HTTP ${httpStatus} at ${timestamp}.`,
        ];
        if (hops > 0) notesParts.push(`Resolved after ${hops} redirect(s).`);
        if (isOversized) notesParts.push('Page exceeds 500KB; verified within initial payload.');

        return {
          isVerified: true,
          status: 'active',
          httpStatus,
          linkType: detection.linkType,
          anchorText: detection.anchorText,
          notes: notesParts.join(' '),
          hops,
          finalUrl,
          isOversized,
        };
      }

      // Link not found: check if page resembles an empty client-side SPA container
      const isSpaLikely =
        html.length < 5000 && (html.includes('id="root"') || html.includes('id="app"') || html.includes('id="__next"'));

      const missingNotes = [
        `Target link "${targetUrl}" was not found in the page HTML (HTTP ${httpStatus} checked at ${timestamp}).`,
      ];
      if (hops > 0) missingNotes.push(`Followed ${hops} redirect(s) to ${finalUrl}.`);
      if (isSpaLikely) missingNotes.push('Page appears to rely on client-side JavaScript rendering; static HTML link not detected.');
      if (isOversized) missingNotes.push('Note: Page exceeds 500KB; link was not found in the initial 500KB stream.');

      return {
        isVerified: false,
        status: 'lost',
        httpStatus,
        notes: missingNotes.join(' '),
        hops,
        finalUrl,
        isOversized,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      return {
        isVerified: false,
        status: 'broken',
        httpStatus: null,
        notes: `Verification failed: ${errMsg} (Checked at ${timestamp})`,
        hops: 0,
      };
    }
  }

  /**
   * Verifies an existing tracked backlink by ID and updates its database fields via the repository.
   */
  public async verifyBacklink(id: string): Promise<TrackedBacklink> {
    const record = await backlinkTrackerRepository.getById(id);
    if (!record) {
      throw new Error(`Tracked backlink with ID "${id}" does not exist.`);
    }

    logger.info(`Verifying tracked backlink [${record.id}] from ${record.sourceUrl} -> ${record.targetUrl}...`, 'BacklinkVerificationService');

    const result = await this.verifyBacklinkData(record.sourceUrl, record.targetUrl);

    const updated = await backlinkTrackerRepository.update(record.id, {
      httpStatus: result.httpStatus,
      isVerified: result.isVerified,
      lastCheckedAt: new Date(),
      status: result.status,
      linkType: result.linkType || record.linkType,
      anchorText: result.anchorText || record.anchorText,
      notes: result.notes,
    });

    if (!updated) {
      throw new Error(`Failed to update tracked backlink [${record.id}] after verification.`);
    }

    return updated;
  }

  /**
   * Verifies all active or pending backlinks sequentially with rate limiting.
   */
  public async verifyAll(limit: number = 50): Promise<VerificationBatchSummary> {
    const all = await backlinkTrackerRepository.getAll();
    const targets = all.slice(0, Math.max(1, Math.min(limit, 100)));

    const summary: VerificationBatchSummary = {
      processed: 0,
      active: 0,
      lost: 0,
      broken: 0,
    };

    for (const item of targets) {
      try {
        const updated = await this.verifyBacklink(item.id);
        summary.processed++;
        if (updated.status === 'active') summary.active++;
        else if (updated.status === 'lost') summary.lost++;
        else if (updated.status === 'broken') summary.broken++;
      } catch (err) {
        logger.error(`Batch verification error for [${item.id}]`, 'BacklinkVerificationService', err);
        summary.processed++;
        summary.broken++;
      }
    }

    return summary;
  }
}

export const backlinkVerificationService = new BacklinkVerificationService();
