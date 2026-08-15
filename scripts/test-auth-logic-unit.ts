import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authService } from '../server/services/auth.service';
import { ADMIN_COOKIE_NAME } from '../server/middleware/auth';
import { config } from '../server/config/env';

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

async function testAuthLogic() {
  console.log('====================================================');
  console.log('LEGOMARK INDIA — AUTH SERVICE LOGIC & CRYPTO TESTS');
  console.log('====================================================\n');

  // 1. Password Hashing & Verification
  console.log('--- 1. BCRYPT PASSWORD HASHING ---');
  const password = 'TestAdminSecurePassword2026!';
  const hash = await authService.hashPassword(password);
  assert(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'), 'bcrypt hash uses work factor 12', hash.substring(0, 10));

  const verifyCorrect = await authService.verifyPassword(password, hash);
  assert(verifyCorrect === true, 'Correct password verifies successfully');

  const verifyWrong = await authService.verifyPassword('WrongPassword123!', hash);
  assert(verifyWrong === false, 'Wrong password fails verification');

  // 2. Token Hashing (SHA-256)
  console.log('\n--- 2. SHA-256 OPAQUE TOKEN HASHING ---');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash1 = authService.hashToken(rawToken);
  const tokenHash2 = crypto.createHash('sha256').update(rawToken).digest('hex');
  assert(tokenHash1 === tokenHash2, 'SHA-256 hash calculation matches crypto.createHash', tokenHash1.substring(0, 16));
  assert(tokenHash1.length === 64, 'Token hash is exactly 64 hex characters (256-bit)');

  // 3. Cookie Configuration Check
  console.log('\n--- 3. COOKIE NAME & CONFIGURATION ---');
  assert(ADMIN_COOKIE_NAME === 'legomark_admin_session', 'Cookie name is legomark_admin_session');
  assert(typeof config.auth.sessionMaxAgeDays === 'number', 'sessionMaxAgeDays is defined');
  const maxAgeMs = config.auth.sessionMaxAgeDays * 24 * 60 * 60 * 1000;
  assert(maxAgeMs === 7 * 24 * 60 * 60 * 1000, 'Max age computes to 7 days in milliseconds');

  console.log('\n====================================================');
  console.log(`LOGIC TESTS TOTAL PASSED: ${passCount}`);
  console.log(`LOGIC TESTS TOTAL FAILED: ${failCount}`);
  console.log('====================================================');
}

testAuthLogic();
