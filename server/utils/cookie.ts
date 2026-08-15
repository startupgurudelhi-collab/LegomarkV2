import { Request, CookieOptions } from 'express';
import { config } from '../config/env';

/**
 * Determine if the incoming request is over HTTPS or forwarded as HTTPS by a reverse proxy.
 */
export function isRequestSecure(req: Request): boolean {
  // If explicitly configured via environment variable
  if (process.env.ADMIN_COOKIE_SECURE !== undefined) {
    return process.env.ADMIN_COOKIE_SECURE === 'true';
  }

  // 1. Native Express req.secure (respects 'trust proxy' and X-Forwarded-Proto)
  if (req.secure) {
    return true;
  }

  // 2. Check X-Forwarded-Proto header explicitly
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }

  // 3. Check X-Forwarded-Ssl header
  if (req.headers['x-forwarded-ssl'] === 'on') {
    return true;
  }

  // 4. Check Front-End-Https header
  if (req.headers['front-end-https'] === 'on') {
    return true;
  }

  // 5. Default to false for non-TLS/HTTP (e.g. initial Coolify sslip.io or local dev)
  return false;
}

/**
 * Build dynamic session cookie options adapted to the request's TLS/proxy state.
 *
 * Rules:
 * - httpOnly: always true (XSS mitigation)
 * - secure: true ONLY when connection/proxy is HTTPS, false for plain HTTP (so browser accepts cookie)
 * - sameSite: 'lax' (protects against CSRF while allowing top-level navigations)
 * - path: '/' (valid across entire application)
 * - maxAge: configured duration in ms
 */
export function getSessionCookieOptions(req: Request, maxAgeMs?: number): CookieOptions {
  const secure = isRequestSecure(req);

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  };

  if (maxAgeMs !== undefined) {
    options.maxAge = maxAgeMs;
  }

  return options;
}
