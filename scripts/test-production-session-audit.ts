import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { getSessionCookieOptions, isRequestSecure } from '../server/utils/cookie';
import { applySecurityMiddleware } from '../server/middleware/security';
import apiRouter from '../server/routes/index';
import { authService } from '../server/services/auth.service';
import { ADMIN_COOKIE_NAME } from '../server/middleware/auth';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runSessionAuditSuite() {
  console.log('\n======================================================');
  console.log('LEGOMARK INDIA — PRODUCTION COOKIE & SESSION AUDIT');
  console.log('======================================================\n');

  // 1. Unit Tests on isRequestSecure & getSessionCookieOptions
  console.log('--- 1. COOKIE SECURE RESOLUTION UNIT TESTS ---');

  // Plain HTTP request (e.g. initial Coolify sslip.io test environment)
  const mockHttpReq = {
    secure: false,
    headers: {},
  } as any;
  assert(!isRequestSecure(mockHttpReq), 'HTTP request resolves secure=false');
  const httpCookieOpts = getSessionCookieOptions(mockHttpReq, 604800000);
  assert(httpCookieOpts.secure === false, 'Cookie secure is false on plain HTTP (browser accepts cookie)');
  assert(httpCookieOpts.httpOnly === true, 'Cookie httpOnly is always true (XSS protection)');
  assert(httpCookieOpts.sameSite === 'lax', 'Cookie sameSite is lax');
  assert(httpCookieOpts.path === '/', 'Cookie path is /');
  assert(httpCookieOpts.maxAge === 604800000, 'Cookie maxAge is 7 days');

  // HTTPS request directly (req.secure = true)
  const mockHttpsReq = {
    secure: true,
    headers: {},
  } as any;
  assert(isRequestSecure(mockHttpsReq), 'HTTPS request resolves secure=true');
  const httpsCookieOpts = getSessionCookieOptions(mockHttpsReq, 604800000);
  assert(httpsCookieOpts.secure === true, 'Cookie secure is true on native HTTPS');

  // Reverse Proxy Forwarded HTTPS request (x-forwarded-proto: https)
  const mockProxyHttpsReq = {
    secure: false,
    headers: {
      'x-forwarded-proto': 'https, http',
    },
  } as any;
  assert(isRequestSecure(mockProxyHttpsReq), 'Reverse proxy with x-forwarded-proto: https resolves secure=true');
  const proxyCookieOpts = getSessionCookieOptions(mockProxyHttpsReq, 604800000);
  assert(proxyCookieOpts.secure === true, 'Cookie secure is true under HTTPS reverse proxy');

  // Reverse Proxy Forwarded HTTP request (x-forwarded-proto: http)
  const mockProxyHttpReq = {
    secure: false,
    headers: {
      'x-forwarded-proto': 'http',
    },
  } as any;
  assert(!isRequestSecure(mockProxyHttpReq), 'Reverse proxy with x-forwarded-proto: http resolves secure=false');
  const proxyHttpOpts = getSessionCookieOptions(mockProxyHttpReq);
  assert(proxyHttpOpts.secure === false, 'Cookie secure is false under HTTP reverse proxy');

  // 2. Integration Tests: Live Express Instance Authentication & Change-Password Cycle
  console.log('\n--- 2. LIVE SERVER AUTH & CHANGE-PASSWORD INTEGRATION TESTS ---');

  const app = express();
  app.set('trust proxy', 1);
  applySecurityMiddleware(app);
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address() as AddressInfo;
  const port = address.port;

  try {
    // A. Unauthenticated POST /api/auth/change-password -> MUST return 401
    console.log('\n[Test A] Unauthenticated POST /api/auth/change-password');
    const unauthRes = await makeRequest(port, '/api/auth/change-password', 'POST', {
      newPassword: 'NewSecurePassword2026!',
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated change-password returns 401 Unauthorized');
    assert(unauthRes.body.includes('Authentication required'), 'Unauthenticated change-password returns correct error message');

    // B. Mock successful login simulation to verify Set-Cookie header generation on HTTP
    console.log('\n[Test B] Simulated Login & Set-Cookie on HTTP endpoint');
    // Create an endpoint on the test app that invokes AuthController cookie setting pattern
    app.post('/api/test-login-cookie', (req, res) => {
      const opts = getSessionCookieOptions(req, 604800000);
      res.cookie(ADMIN_COOKIE_NAME, 'mock_token_abc123', opts);
      res.json({ success: true });
    });

    const loginRes = await makeRequest(port, '/api/test-login-cookie', 'POST', {});
    assert(loginRes.statusCode === 200, 'Test login endpoint returns 200');
    const setCookie = loginRes.headers['set-cookie'];
    assert(Array.isArray(setCookie) && setCookie.length > 0, 'Response includes Set-Cookie header');
    const cookieHeaderStr = setCookie ? setCookie[0] : '';
    assert(cookieHeaderStr.includes(`${ADMIN_COOKIE_NAME}=mock_token_abc123`), 'Set-Cookie contains session token');
    assert(cookieHeaderStr.includes('HttpOnly'), 'Set-Cookie includes HttpOnly');
    assert(cookieHeaderStr.includes('Path=/'), 'Set-Cookie includes Path=/');
    assert(cookieHeaderStr.includes('SameSite=Lax'), 'Set-Cookie includes SameSite=Lax');
    assert(!cookieHeaderStr.includes('Secure'), 'Set-Cookie does NOT include Secure on HTTP (so browser accepts and stores it)');

    // C. Simulated Login on Forwarded HTTPS endpoint (x-forwarded-proto: https)
    console.log('\n[Test C] Simulated Login & Set-Cookie on Forwarded HTTPS endpoint');
    const httpsLoginRes = await makeRequest(
      port,
      '/api/test-login-cookie',
      'POST',
      {},
      { 'x-forwarded-proto': 'https' }
    );
    const httpsSetCookie = httpsLoginRes.headers['set-cookie'];
    const httpsCookieHeaderStr = httpsSetCookie ? httpsSetCookie[0] : '';
    assert(httpsCookieHeaderStr.includes('Secure'), 'Set-Cookie includes Secure on HTTPS reverse proxy');

    // D. Mock Validated Authenticated Session for Change-Password
    console.log('\n[Test D] Authenticated change-password with session validation');
    // Mock validateSession to return a valid user profile
    const originalValidate = authService.validateSession;
    const originalChange = authService.changePassword;

    (authService as any).validateSession = async (token: string) => {
      if (token === 'valid_session_token_xyz') {
        return {
          user: {
            id: 'admin-test-uuid',
            email: 'nomaan@legomarkindia.com',
            fullName: 'Nomaan Admin',
            role: 'ADMIN',
            mustChangePassword: true,
          },
          session: {
            id: 'session-uuid',
            userId: 'admin-test-uuid',
          },
        };
      }
      return null;
    };

    (authService as any).changePassword = async (userId: string, newPwd: string) => {
      return {
        id: userId,
        email: 'nomaan@legomarkindia.com',
        fullName: 'Nomaan Admin',
        role: 'ADMIN',
        mustChangePassword: false,
      };
    };

    // Make request with Cookie header
    const authChangeRes = await makeRequest(
      port,
      '/api/auth/change-password',
      'POST',
      {
        newPassword: 'BrandNewPassword2026!',
        confirmPassword: 'BrandNewPassword2026!',
      },
      {
        Cookie: `${ADMIN_COOKIE_NAME}=valid_session_token_xyz`,
      }
    );

    assert(authChangeRes.statusCode === 200, 'Authenticated change-password with valid session returns 200 OK');
    assert(authChangeRes.body.includes('Password changed successfully'), 'Response contains success confirmation');
    assert(authChangeRes.body.includes('"mustChangePassword":false'), 'User profile reflects mustChangePassword: false');

    // Restore original methods
    authService.validateSession = originalValidate;
    authService.changePassword = originalChange;
  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log(`SESSION AUDIT SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

function makeRequest(
  port: number,
  path: string,
  method: string,
  bodyData: any,
  extraHeaders: Record<string, string> = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const jsonBody = JSON.stringify(bodyData);
    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonBody),
        ...extraHeaders,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.write(jsonBody);
    req.end();
  });
}

runSessionAuditSuite().catch((err) => {
  console.error('Session audit suite failed:', err);
  process.exit(1);
});
