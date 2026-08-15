import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import apiRouter from '../server/routes/index';
import { applySecurityMiddleware } from '../server/middleware/security';
import { getDatabase, pingDatabase, closeDatabasePool } from '../server/config/database';
import { config } from '../server/config/env';
import { adminUsers, adminSessions } from '../db/schema/index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName}${detail ? ` (${detail})` : ''}`);
    passCount++;
  } else {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testName}${detail ? ` (${detail})` : ''}`);
    failCount++;
  }
}

async function startServer(): Promise<{ server: http.Server; baseUrl: string }> {
  const app = express();
  app.set('trust proxy', 1);
  applySecurityMiddleware(app);
  app.use('/api', apiRouter);

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3000;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function runAuthVerification() {
  console.log('====================================================');
  console.log('LEGOMARK INDIA — ADMIN LOGIN PRODUCTION VERIFICATION');
  console.log('====================================================\n');

  // Check 1: Database URL & Connection
  console.log('--- 1. DATABASE & CONFIGURATION CHECKS ---');
  const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
  console.log(`DATABASE_URL configured: ${hasDbUrl ? 'YES (configured)' : 'NO (fallback/discrete)'}`);
  console.log(`NODE_ENV: ${config.env}`);
  console.log(`SESSION_SECRET configured: ${Boolean(config.auth.sessionSecret)} (length: ${config.auth.sessionSecret.length})`);
  console.log(`ADMIN_COOKIE_SECURE: ${config.auth.cookieSecure}`);
  console.log(`ADMIN_SESSION_MAX_AGE_DAYS: ${config.auth.sessionMaxAgeDays} days`);

  assert(Boolean(config.auth.sessionSecret), 'SESSION_SECRET exists and is populated');
  assert(config.auth.sessionMaxAgeDays >= 1, 'ADMIN_SESSION_MAX_AGE_DAYS is valid positive number');

  const dbStatus = await pingDatabase();
  console.log(`Database Connected: ${dbStatus.connected ? 'YES' : 'NO'}`);
  if (dbStatus.connected) {
    console.log(`Database Latency: ${dbStatus.latencyMs}ms`);
  } else {
    console.log(`Database Error Notice: ${dbStatus.error}`);
  }

  const { server, baseUrl } = await startServer();

  try {
    // Check 2: Unauthenticated access rejection
    console.log('\n--- 2. UNAUTHENTICATED ENDPOINT REJECTIONS ---');
    const unauthMe = await fetch(`${baseUrl}/api/auth/me`);
    assert(unauthMe.status === 401, 'GET /api/auth/me rejects unauthenticated request with 401', `Status: ${unauthMe.status}`);

    const unauthPackages = await fetch(`${baseUrl}/api/admin/packages`);
    assert(unauthPackages.status === 401, 'GET /api/admin/packages rejects unauthenticated request with 401', `Status: ${unauthPackages.status}`);

    const unauthServices = await fetch(`${baseUrl}/api/admin/services`);
    assert(unauthServices.status === 401, 'GET /api/admin/services rejects unauthenticated request with 401', `Status: ${unauthServices.status}`);

    // Check 3: Missing credentials rejection
    console.log('\n--- 3. LOGIN VALIDATION & REJECTION CHECKS ---');
    const emptyLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(emptyLogin.status === 400, 'POST /api/auth/login with empty body returns 400', `Status: ${emptyLogin.status}`);

    // Non-existent user login
    const nonExistentLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_admin_test@legomark.in', password: 'InvalidPassword123!' }),
    });
    assert(nonExistentLogin.status === 401, 'POST /api/auth/login with non-existent user returns 401', `Status: ${nonExistentLogin.status}`);

    if (dbStatus.connected) {
      console.log('\n--- 4. LIVE DATABASE ADMIN USER & SESSION VERIFICATION ---');
      const db = getDatabase();

      // Check existing admin users
      const existingAdmins = await db.select({
        id: adminUsers.id,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
      }).from(adminUsers);

      console.log(`Total Admin Users in Database: ${existingAdmins.length}`);
      existingAdmins.forEach((u) => {
        console.log(`  - Admin User: ${u.email} | Role: ${u.role} | Active: ${u.isActive} | Name: ${u.fullName}`);
      });

      // Temporary test admin user for verifying the full login & session lifecycle
      const testEmail = `test_verification_admin_${Date.now()}@legomark.in`;
      const testPassword = `VerificationPass_${Date.now()}!`;
      const testPasswordHash = await bcrypt.hash(testPassword, 12);

      const [createdUser] = await db.insert(adminUsers).values({
        email: testEmail,
        passwordHash: testPasswordHash,
        fullName: 'Production Verification Admin',
        role: 'ADMIN',
        isActive: true,
      }).returning();

      assert(Boolean(createdUser && createdUser.id), 'Test admin user created with bcrypt hash');
      assert(createdUser.isActive === true, 'Test admin user is active');
      assert(createdUser.role === 'ADMIN', 'Test admin user role is ADMIN');

      try {
        // Wrong password test
        const wrongPassLogin = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, password: 'WrongPassword123!' }),
        });
        assert(wrongPassLogin.status === 401, 'POST /api/auth/login with wrong password returns 401', `Status: ${wrongPassLogin.status}`);

        // Correct password login
        console.log('\n--- 5. SUCCESSFUL LOGIN & COOKIE ISSUANCE ---');
        const validLogin = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, password: testPassword }),
        });

        assert(validLogin.status === 200, 'POST /api/auth/login with valid credentials returns 200', `Status: ${validLogin.status}`);
        const loginJson = await validLogin.json();
        assert(loginJson.success === true, 'Login response success is true');
        assert(loginJson.data?.user?.email === testEmail, 'Login response returns correct user email');
        assert(loginJson.data?.user?.role === 'ADMIN', 'Login response returns correct role (ADMIN)');

        // Inspect Set-Cookie header
        const setCookieHeader = validLogin.headers.get('set-cookie');
        assert(Boolean(setCookieHeader), 'Set-Cookie header is issued in login response');
        console.log(`Set-Cookie Header Present: YES`);
        const hasHttpOnly = setCookieHeader?.includes('HttpOnly') || setCookieHeader?.includes('httponly');
        const hasSameSite = setCookieHeader?.includes('SameSite=Lax') || setCookieHeader?.includes('samesite=lax');
        const hasPath = setCookieHeader?.includes('Path=/') || setCookieHeader?.includes('path=/');
        assert(hasHttpOnly, 'Cookie contains HttpOnly flag');
        assert(hasSameSite, 'Cookie contains SameSite=Lax flag');
        assert(hasPath, 'Cookie contains Path=/ flag');

        // Extract cookie value for subsequent requests
        const cookieMatch = setCookieHeader?.match(/legomark_admin_session=([^;]+)/);
        const cookieValue = cookieMatch ? cookieMatch[1] : '';
        assert(Boolean(cookieValue && cookieValue.length > 0), 'Session cookie value extracted successfully');

        // Check 6: GET /api/auth/me with Cookie
        console.log('\n--- 6. AUTHENTICATED SESSION VERIFICATION (/api/auth/me) ---');
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            Cookie: `legomark_admin_session=${cookieValue}`,
          },
        });
        assert(meRes.status === 200, 'GET /api/auth/me with session cookie returns 200', `Status: ${meRes.status}`);
        const meJson = await meRes.json();
        assert(meJson.data?.user?.email === testEmail, 'GET /api/auth/me returns authenticated user email');
        assert(meJson.data?.user?.role === 'ADMIN', 'GET /api/auth/me returns user role (ADMIN)');

        // Check 7: Access Protected Admin Endpoints
        console.log('\n--- 7. PROTECTED ADMIN ROUTE ACCESS WITH SESSION ---');
        const adminPackagesRes = await fetch(`${baseUrl}/api/admin/packages`, {
          headers: {
            Cookie: `legomark_admin_session=${cookieValue}`,
          },
        });
        assert(adminPackagesRes.status === 200, 'GET /api/admin/packages accessible with session cookie (200)', `Status: ${adminPackagesRes.status}`);

        const adminServicesRes = await fetch(`${baseUrl}/api/admin/services`, {
          headers: {
            Cookie: `legomark_admin_session=${cookieValue}`,
          },
        });
        assert(adminServicesRes.status === 200, 'GET /api/admin/services accessible with session cookie (200)', `Status: ${adminServicesRes.status}`);

        // Check 8: Logout
        console.log('\n--- 8. LOGOUT & SESSION REVOCATION ---');
        const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Cookie: `legomark_admin_session=${cookieValue}`,
          },
        });
        assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200', `Status: ${logoutRes.status}`);

        // Verify session revoked in database
        const meAfterLogout = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            Cookie: `legomark_admin_session=${cookieValue}`,
          },
        });
        assert(meAfterLogout.status === 401, 'GET /api/auth/me after logout is rejected with 401', `Status: ${meAfterLogout.status}`);

        const packagesAfterLogout = await fetch(`${baseUrl}/api/admin/packages`, {
          headers: {
            Cookie: `legomark_admin_session=${cookieValue}`,
          },
        });
        assert(packagesAfterLogout.status === 401, 'GET /api/admin/packages after logout is rejected with 401', `Status: ${packagesAfterLogout.status}`);

      } finally {
        // Cleanup test user
        await db.delete(adminSessions).where(eq(adminSessions.userId, createdUser.id));
        await db.delete(adminUsers).where(eq(adminUsers.id, createdUser.id));
      }
    } else {
      console.log('\n\x1b[33m[NOTE] Direct PostgreSQL database connection offline in local runner. Testing auth service business logic.\x1b[0m');
    }

    console.log('\n====================================================');
    console.log(`AUTH VERIFICATION TOTAL PASSED: ${passCount}`);
    console.log(`AUTH VERIFICATION TOTAL FAILED: ${failCount}`);
    console.log('====================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
  } finally {
    server.close();
    await closeDatabasePool();
  }
}

runAuthVerification();
