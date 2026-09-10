import { Lead } from '../../db/schema/index';
import { logger } from '../utils/logger';

export interface ExtraLeadContext {
  selectedService?: string;
  packageDetails?: string;
  packageFee?: string | number;
  state?: string;
  city?: string;
  submissionChannel?: string;
  notes?: string;
  message?: string;
  paymentId?: string;
  paymentOrderId?: string;
}

export interface CrmLeadPayload {
  customerName: string;
  mobile: string;
  email: string | null;
  serviceRequired: string;
  packageDetails: string | null;
  packageFee: string | number | null;
  city: string | null;
  state: string | null;
  externalLeadId: string;
  websiteUrl: string;
  submissionChannel: string;
  source: string;
  notes: string | null;
}

export interface CrmSyncResult {
  success: boolean;
  crmLeadId?: string;
  skipped?: boolean;
  status?: number;
  error?: string;
}

/**
 * Service to deliver website leads from LEGOMARK to EFILINGG CRM
 * Endpoint: POST https://efilingg.cloud/api/leads/website
 */
class CrmService {
  private readonly defaultApiUrl = 'https://efilingg.cloud/api/leads/website';
  private readonly websiteDomain = 'legomarkindia.com';
  private readonly crmSource = 'Website (LEGOMARK INDIA)';

  // In-memory set of lead IDs already synced to prevent duplicate CRM submissions
  private syncedLeadIds = new Set<string>();
  // In-memory set of payment IDs already synced to prevent duplicate payment deliveries
  private syncedPaymentIds = new Set<string>();
  // In-flight tracking to prevent concurrent duplicate submissions for the same lead or payment
  private inFlightSyncs = new Set<string>();

  /**
   * Resolve CRM API URL from environment variable or default
   */
  private getApiUrl(): string {
    return process.env.EFILINGG_CRM_API_URL?.trim() || this.defaultApiUrl;
  }

  /**
   * Resolve CRM Bearer Token safely from environment variables
   */
  private getApiToken(): string | undefined {
    const token =
      process.env.EFILINGG_CRM_API_TOKEN ||
      process.env.EFILINGG_CRM_TOKEN ||
      process.env.CRM_BEARER_TOKEN ||
      process.env.EFILINGG_API_TOKEN ||
      process.env.CRM_API_TOKEN;

    const trimmed = token?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Check if a lead has already been successfully synced to the CRM
   */
  isLeadSynced(leadId: string): boolean {
    return this.syncedLeadIds.has(leadId);
  }

  /**
   * Mark a lead as synced
   */
  markLeadSynced(leadId: string): void {
    this.syncedLeadIds.add(leadId);
  }

  /**
   * Check if a specific payment has already been synced to the CRM
   */
  isPaymentSynced(paymentId: string): boolean {
    return this.syncedPaymentIds.has(paymentId);
  }

  /**
   * Mark a payment as synced
   */
  markPaymentSynced(paymentId: string): void {
    this.syncedPaymentIds.add(paymentId);
  }

  /**
   * Map a LEGOMARK lead and optional submission context to the CRM payload schema
   */
  buildCrmPayload(lead: Lead, context?: ExtraLeadContext): CrmLeadPayload {
    // 1. Service required resolution:
    let rawService = (context?.selectedService || lead.serviceInterested || 'General Consultation').trim();
    if (rawService.startsWith('[PAID ORDER]')) {
      rawService = rawService.replace(/^\[PAID ORDER\]\s*/i, '').trim();
    }

    let serviceRequired = rawService;
    let extractedPackage: string | null = null;

    if (serviceRequired.includes(' - ')) {
      const [sPart, ...pParts] = serviceRequired.split(' - ');
      serviceRequired = sPart.trim();
      extractedPackage = pParts.join(' - ').trim();
    } else if (serviceRequired.includes(' (') && serviceRequired.includes(')')) {
      const sPart = serviceRequired.split(' (')[0].trim();
      const pPart = serviceRequired.split(' (')[1].replace(/\)$/, '').trim();
      serviceRequired = sPart;
      extractedPackage = pPart;
    }

    // 2. Package details: use explicit package details, or fall back to extracted package or selectedService
    let packageDetails: string | null = null;
    if (context?.packageDetails && context.packageDetails.trim().length > 0) {
      packageDetails = context.packageDetails.trim();
    } else if (extractedPackage && extractedPackage.length > 0) {
      packageDetails = extractedPackage;
    } else if (
      context?.selectedService &&
      context.selectedService.trim().length > 0 &&
      context.selectedService.trim() !== lead.serviceInterested.trim()
    ) {
      packageDetails = context.selectedService.trim();
    }

    // 3. Package fee: numeric or clean string if available
    let packageFee: string | number | null = null;
    if (context?.packageFee !== undefined && context.packageFee !== null) {
      if (typeof context.packageFee === 'number' && !isNaN(context.packageFee)) {
        packageFee = context.packageFee;
      } else {
        const feeStr = String(context.packageFee).trim();
        if (feeStr.length > 0) {
          packageFee = feeStr;
        }
      }
    }

    // 4. Notes: aggregate lead message and notes
    const messagePart = (lead.message || context?.message || '').trim();
    const notesPart = (context?.notes || '').trim();
    let combinedNotes: string | null = null;
    if (messagePart && notesPart && messagePart !== notesPart) {
      combinedNotes = `${messagePart}\n\nAdditional Notes: ${notesPart}`;
    } else {
      combinedNotes = messagePart || notesPart || null;
    }

    // 5. Submission channel: default to lead source / form type
    const channel = (context?.submissionChannel || lead.source || 'Website Consultation Modal').trim();

    return {
      customerName: (lead.fullName || '').trim(),
      mobile: (lead.phone || '').trim(),
      email: lead.email ? lead.email.trim() : null,
      serviceRequired: serviceRequired || 'General Consultation',
      packageDetails,
      packageFee,
      city: lead.city?.trim() || context?.city?.trim() || null,
      state: context?.state?.trim() || null,
      externalLeadId: lead.id,
      websiteUrl: this.websiteDomain,
      submissionChannel: channel,
      source: this.crmSource,
      notes: combinedNotes,
    };
  }

  /**
   * Forward a LEGOMARK lead to EFILINGG CRM
   * Fails safely without disrupting the primary LEGOMARK lead record.
   */
  async sendLeadToCrm(lead: Lead, context?: ExtraLeadContext): Promise<CrmSyncResult> {
    if (!lead || !lead.id) {
      return { success: false, error: 'Invalid lead provided to CRM sync' };
    }

    const isPayment = Boolean(context?.paymentId);
    const syncKey = context?.paymentId ? `pay_${context.paymentId}` : `lead_${lead.id}`;

    // 1. Payment Deduplication: If this exact payment ID was already synced to CRM, skip
    if (isPayment && context?.paymentId && this.syncedPaymentIds.has(context.paymentId)) {
      logger.info(
        `Payment ${context.paymentId} for lead ${lead.id} was already forwarded to EFILINGG CRM. Skipping duplicate delivery.`,
        'CrmService'
      );
      return { success: true, skipped: true };
    }

    // 2. Unpaid Lead Deduplication: If this unpaid lead ID was already synced to CRM, skip
    if (!isPayment && this.syncedLeadIds.has(lead.id)) {
      logger.info(
        `Lead ${lead.id} was already forwarded to EFILINGG CRM. Skipping duplicate delivery.`,
        'CrmService'
      );
      return { success: true, skipped: true };
    }

    // 3. In-flight guard: If a sync for this exact payment or unpaid lead is already in progress, skip concurrent duplicate
    if (this.inFlightSyncs.has(syncKey)) {
      logger.info(
        `CRM sync for ${syncKey} is already in flight. Skipping concurrent duplicate.`,
        'CrmService'
      );
      return { success: true, skipped: true };
    }

    this.inFlightSyncs.add(syncKey);

    try {
      const apiUrl = this.getApiUrl();
      const apiToken = this.getApiToken();
      const payload = this.buildCrmPayload(lead, context);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s safety timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {
        // Non-JSON response
      }

      if (response.ok && (responseData?.success !== false)) {
        this.syncedLeadIds.add(lead.id);
        if (context?.paymentId) {
          this.syncedPaymentIds.add(context.paymentId);
        }
        const crmId = responseData?.lead?.id || responseData?.id;

        logger.info(
          `Successfully delivered lead ${lead.id} to EFILINGG CRM (Status: ${response.status}${crmId ? `, CRM Lead ID: ${crmId}` : ''})`,
          'CrmService'
        );

        return {
          success: true,
          crmLeadId: crmId,
          status: response.status,
        };
      } else {
        const errorMsg = responseData?.error || responseData?.message || response.statusText || 'CRM rejected payload';
        // Note: We log the status and sanitized error without exposing any tokens or auth headers
        logger.warn(
          `EFILINGG CRM returned status ${response.status} for lead ${lead.id}: ${errorMsg}`,
          'CrmService'
        );

        return {
          success: false,
          status: response.status,
          error: errorMsg,
        };
      }
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      const msg = isAbort ? 'Request timed out after 10 seconds' : (err?.message || 'Network error');

      // Log failure safely without exposing sensitive configuration
      logger.error(
        `Failed to forward lead ${lead.id} to EFILINGG CRM (non-blocking): ${msg}`,
        'CrmService'
      );

      return {
        success: false,
        error: msg,
      };
    } finally {
      this.inFlightSyncs.delete(syncKey);
    }
  }
}

export const crmService = new CrmService();
