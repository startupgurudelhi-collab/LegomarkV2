import path from 'path';
import fs from 'fs';
import { config } from '../server/config/env';
import { UPLOAD_DIR, SUB_DIRS, ensureUploadDirectoriesExist } from '../server/utils/upload';
import { mediaController } from '../server/controllers/media.controller';

async function runStoragePersistenceAudit() {
  console.log('======================================================');
  console.log('LEGOMARK INDIA — PERSISTENT MEDIA STORAGE AUDIT');
  console.log('======================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  console.log('\n--- 1. CONFIGURATION & DIRECTORY RESOLUTION ---');
  assert(Boolean(config.uploadsDir), `config.uploadsDir is resolved: ${config.uploadsDir}`);
  assert(UPLOAD_DIR === config.uploadsDir, `server/utils/upload UPLOAD_DIR matches config.uploadsDir`);

  ensureUploadDirectoriesExist();
  assert(fs.existsSync(config.uploadsDir), `Upload root directory exists: ${config.uploadsDir}`);

  for (const sub of SUB_DIRS) {
    const subPath = path.join(config.uploadsDir, sub);
    assert(fs.existsSync(subPath), `Category subfolder exists on disk: ${subPath}`);
  }

  console.log('\n--- 2. UPLOAD & DISK PERSISTENCE SIMULATION ---');
  // Write a test image artifact to simulate upload
  const testCategory = 'founder';
  const testFilename = `audit_test_${Date.now()}.png`;
  const testFilePath = path.join(config.uploadsDir, testCategory, testFilename);
  const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  fs.writeFileSync(testFilePath, testBuffer);
  assert(fs.existsSync(testFilePath), `Test file written to persistent storage: ${testFilePath}`);
  assert(fs.statSync(testFilePath).size > 0, `Test file has valid size: ${fs.statSync(testFilePath).size} bytes`);

  console.log('\n--- 3. MEDIA CONTROLLER LIST & RETRIEVAL ---');
  const mockReq: any = {};
  let responseData: any = null;
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => {
        responseData = data;
        return data;
      },
    }),
  };

  await mediaController.listMedia(mockReq, mockRes, (() => {}) as any);
  assert(responseData && responseData.success === true, `mediaController.listMedia returns success`);
  assert(Array.isArray(responseData.data), `mediaController.listMedia returns array of assets`);

  const foundItem = responseData.data.find((item: any) => item.name === testFilename);
  assert(Boolean(foundItem), `mediaController listed the newly persisted test file`);
  assert(foundItem?.url === `/uploads/${testCategory}/${testFilename}`, `Generated URL format matches: /uploads/${testCategory}/${testFilename}`);

  console.log('\n--- 4. CLEANUP & DELETION SAFETY ---');
  const mockDeleteReq: any = {
    body: { url: `/uploads/${testCategory}/${testFilename}` },
  };
  let deleteResponse: any = null;
  const mockDeleteRes: any = {
    status: (code: number) => ({
      json: (data: any) => {
        deleteResponse = data;
        return data;
      },
    }),
  };

  await mediaController.deleteMedia(mockDeleteReq, mockDeleteRes, (() => {}) as any);
  assert(deleteResponse && deleteResponse.success === true, `mediaController.deleteMedia reports success`);
  assert(!fs.existsSync(testFilePath), `Test file cleanly removed from persistent directory`);

  console.log('\n--- 5. PATH TRAVERSAL ATTACK DEFENSE ---');
  const maliciousReq: any = {
    body: { url: '/uploads/../../etc/passwd' },
  };
  let maliciousStatus = 200;
  const mockMaliciousRes: any = {
    status: (code: number) => {
      maliciousStatus = code;
      return {
        json: (data: any) => data,
      };
    },
  };

  await mediaController.deleteMedia(maliciousReq, mockMaliciousRes, (() => {}) as any);
  assert(maliciousStatus === 400 || maliciousStatus === 403, `Path traversal attempt safely rejected with status ${maliciousStatus}`);

  console.log('======================================================');
  console.log(`PERSISTENCE AUDIT SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStoragePersistenceAudit().catch((err) => {
  console.error('Fatal persistence audit failure:', err);
  process.exit(1);
});
