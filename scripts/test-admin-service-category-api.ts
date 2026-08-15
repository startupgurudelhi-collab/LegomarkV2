import express from 'express';
import http from 'http';
import apiRouter from '../server/routes/index';
import { serviceCategoryService } from '../server/services/service-category.service';
import { serviceCategoryRepository } from '../server/repositories/service-category.repository';
import { serviceService } from '../server/services/service.service';
import { getDatabase, closeDatabasePool, pingDatabase } from '../server/config/database';
import { adminUsers, adminSessions, serviceCategories, services } from '../db/schema/index';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SERVICE_CATEGORIES, SERVICES } from '../src/data/websiteData';

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

async function startTestServer(): Promise<{ server: http.Server; baseUrl: string }> {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3000;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

/**
 * Service Layer & Zod Validation test suite for isolated or offline verification
 */
async function runUnitValidationTests() {
  console.log('\n--- 1. Service Layer & Zod Validation Suite ---');

  // Test 1: Reject createCategory with missing id
  try {
    await serviceCategoryService.createCategory({ name: 'Test', shortLabel: 'Test', iconName: 'Building' });
    assert(false, 'Reject create category with missing ID');
  } catch (err: any) {
    assert(true, 'Reject create category with missing ID', err.message);
  }

  // Test 2: Reject createCategory with invalid slug format
  try {
    await serviceCategoryService.createCategory({
      id: 'Invalid Slug with Spaces & CAPS!',
      name: 'Test Category',
      shortLabel: 'Test',
      iconName: 'Building',
    });
    assert(false, 'Reject create category with invalid slug');
  } catch (err: any) {
    assert(true, 'Reject create category with invalid slug', err.message);
  }

  // Test 3: Reject createCategory with missing name
  try {
    await serviceCategoryService.createCategory({
      id: 'valid-slug',
      name: '',
      shortLabel: 'Test',
      iconName: 'Building',
    });
    assert(false, 'Reject create category with empty name');
  } catch (err: any) {
    assert(true, 'Reject create category with empty name', err.message);
  }

  // Test 4: Reject createCategory with missing shortLabel
  try {
    await serviceCategoryService.createCategory({
      id: 'valid-slug-2',
      name: 'Valid Name',
      shortLabel: '',
      iconName: 'Building',
    });
    assert(false, 'Reject create category with empty shortLabel');
  } catch (err: any) {
    assert(true, 'Reject create category with empty shortLabel', err.message);
  }

  // Test 5: Reject createCategory with missing iconName
  try {
    await serviceCategoryService.createCategory({
      id: 'valid-slug-3',
      name: 'Valid Name',
      shortLabel: 'Short',
      iconName: '',
    });
    assert(false, 'Reject create category with empty iconName');
  } catch (err: any) {
    assert(true, 'Reject create category with empty iconName', err.message);
  }

  // Test 6: Reject updateCategory with empty name
  try {
    await serviceCategoryService.updateCategory('company-registration', {
      name: '',
      shortLabel: 'Short',
      iconName: 'Building',
    });
    assert(false, 'Reject update category with empty name');
  } catch (err: any) {
    assert(true, 'Reject update category with empty name', err.message);
  }

  // Test 7: Reject updateCategory on non-existent ID
  try {
    await serviceCategoryService.updateCategory('non-existent-cat-12345', {
      name: 'Valid Name',
      shortLabel: 'Short',
      iconName: 'Building',
    });
    assert(false, 'Reject update on non-existent category');
  } catch (err: any) {
    assert(err.statusCode === 404, 'Reject update on non-existent category with 404', err.message);
  }

  // Test 8: Reject updateStatus with non-boolean
  try {
    await serviceCategoryService.updateStatus('company-registration', { isActive: 'not-a-bool' } as any);
    assert(false, 'Reject non-boolean status');
  } catch (err: any) {
    assert(true, 'Reject non-boolean status', err.message);
  }

  // Test 9: Reject reorder with empty array
  try {
    await serviceCategoryService.reorderCategories({ items: [] });
    assert(false, 'Reject empty items reorder array');
  } catch (err: any) {
    assert(true, 'Reject empty items reorder array', err.message);
  }

  // Test 10: Reject reorder with non-existent category ID
  try {
    await serviceCategoryService.reorderCategories({
      items: [{ id: 'non-existent-item-999', displayOrder: 0 }],
    });
    assert(false, 'Reject reorder referencing non-existent ID');
  } catch (err: any) {
    assert(err.statusCode === 404, 'Reject reorder referencing non-existent ID with 404', err.message);
  }

  // Test 11: Reject deleteCategory with attached services (409 Conflict)
  try {
    await serviceCategoryService.deleteCategory('company-registration');
    assert(false, 'Reject delete category with attached services');
  } catch (err: any) {
    assert(err.statusCode === 409, 'Reject delete category with attached services returns 409', err.message);
    assert(err.message === 'Category cannot be deleted while services are assigned to it.', 'Exact 409 message');
  }

  // Test 12: GET all categories returns all 6 canonical categories with dynamic serviceCount
  const allCats = await serviceCategoryService.getAllCategories();
  assert(allCats.length === 6, `getAllCategories returns 6 canonical categories (Found: ${allCats.length})`);
  
  const pvtCat = allCats.find((c) => c.id === 'company-registration');
  assert(!!pvtCat, 'Found company-registration category');
  assert(pvtCat?.serviceCount === 4, `Dynamic serviceCount for company-registration === 4 (Found: ${pvtCat?.serviceCount})`);

  const taxCat = allCats.find((c) => c.id === 'taxation-gst');
  assert(taxCat?.serviceCount === 5, `Dynamic serviceCount for taxation-gst === 5 (Found: ${taxCat?.serviceCount})`);

  const tmCat = allCats.find((c) => c.id === 'trademark-ip');
  assert(tmCat?.serviceCount === 2, `Dynamic serviceCount for trademark-ip === 2 (Found: ${tmCat?.serviceCount})`);

  const rocCat = allCats.find((c) => c.id === 'compliance-roc');
  assert(rocCat?.serviceCount === 2, `Dynamic serviceCount for compliance-roc === 2 (Found: ${rocCat?.serviceCount})`);

  const licCat = allCats.find((c) => c.id === 'licenses-registrations');
  assert(licCat?.serviceCount === 2, `Dynamic serviceCount for licenses-registrations === 2 (Found: ${licCat?.serviceCount})`);

  const advCat = allCats.find((c) => c.id === 'advisory-secretarial');
  assert(advCat?.serviceCount === 1, `Dynamic serviceCount for advisory-secretarial === 1 (Found: ${advCat?.serviceCount})`);

  // Test 13: Category Ordering ASC
  let isStrictlySorted = true;
  for (let i = 1; i < allCats.length; i++) {
    if (allCats[i].displayOrder < allCats[i - 1].displayOrder) {
      isStrictlySorted = false;
    }
  }
  assert(isStrictlySorted, 'Category catalog is sorted by displayOrder ASC');

  // Test 14: Canonical public services remain 16
  const publicSvcs = await serviceService.getAllPublicServices();
  assert(publicSvcs.length === 16, `All 16 public services intact (Found: ${publicSvcs.length})`);
}

async function runStageE1Verification() {
  console.log('================================================================');
  console.log('STAGE 6B-E1 — ADMIN SERVICE CATEGORY CRUD API VERIFICATION');
  console.log('================================================================\n');

  const { server, baseUrl } = await startTestServer();

  try {
    // ----------------------------------------------------
    // Test 1 & 4: Unauthenticated requests are rejected
    // ----------------------------------------------------
    console.log('--- 1. Unauthenticated Endpoint Protection ---');
    const resNoAuthGet = await fetch(`${baseUrl}/api/admin/service-categories`);
    assert(resNoAuthGet.status === 401, 'GET /api/admin/service-categories without auth returns HTTP 401');

    const resNoAuthPost = await fetch(`${baseUrl}/api/admin/service-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'dummy' }),
    });
    assert(resNoAuthPost.status === 401, 'POST /api/admin/service-categories without auth returns HTTP 401');

    const resNoAuthPut = await fetch(`${baseUrl}/api/admin/service-categories/company-registration`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'dummy' }),
    });
    assert(resNoAuthPut.status === 401, 'PUT /api/admin/service-categories/:id without auth returns HTTP 401');

    const resNoAuthStatus = await fetch(`${baseUrl}/api/admin/service-categories/company-registration/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert(resNoAuthStatus.status === 401, 'PATCH /api/admin/service-categories/:id/status without auth returns HTTP 401');

    const resNoAuthReorder = await fetch(`${baseUrl}/api/admin/service-categories/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    assert(resNoAuthReorder.status === 401, 'PATCH /api/admin/service-categories/reorder without auth returns HTTP 401');

    const resNoAuthDel = await fetch(`${baseUrl}/api/admin/service-categories/company-registration`, {
      method: 'DELETE',
    });
    assert(resNoAuthDel.status === 401, 'DELETE /api/admin/service-categories/:id without auth returns HTTP 401');

    // Run Unit Validation Tests
    await runUnitValidationTests();

    // Check live database availability
    const dbStatus = await pingDatabase();
    if (!dbStatus.connected) {
      console.log(`\n\x1b[33m[NOTICE] Live PostgreSQL is offline in this sandbox (${dbStatus.error}). Service and repository fallback handling verified.\x1b[0m`);
    } else {
      console.log('\n--- 2. Live Database Integration & Role Access ---');
      const db = getDatabase();

      // Ensure an Admin User exists for testing
      let adminUser = (await db.select().from(adminUsers).where(eq(adminUsers.role, 'ADMIN')).limit(1))[0];
      if (!adminUser) {
        const passwordHash = await bcrypt.hash('AdminTestPassword123!', 10);
        const [newAdmin] = await db
          .insert(adminUsers)
          .values({
            email: 'test-admin-e1@legomark.in',
            passwordHash,
            fullName: 'E1 Test Admin',
            role: 'ADMIN',
            isActive: true,
          })
          .returning();
        adminUser = newAdmin;
      }

      const rawAdminToken = crypto.randomBytes(32).toString('hex');
      const adminTokenHash = crypto.createHash('sha256').update(rawAdminToken).digest('hex');
      await db.insert(adminSessions).values({
        userId: adminUser.id,
        sessionTokenHash: adminTokenHash,
        ipAddress: '127.0.0.1',
        userAgent: 'E1-Test-Suite',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const adminHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      };

      // Live GET /api/admin/service-categories
      const resLiveList = await fetch(`${baseUrl}/api/admin/service-categories`, { headers: adminHeaders });
      assert(resLiveList.status === 200, 'Live authenticated GET /api/admin/service-categories returns 200');
      const jsonLive = await resLiveList.json();
      assert(jsonLive.success === true && Array.isArray(jsonLive.data), 'Live data array returned');

      // Live POST
      const liveTestCat = 'live-test-fdi-category';
      await db.delete(serviceCategories).where(eq(serviceCategories.id, liveTestCat));
      const resLivePost = await fetch(`${baseUrl}/api/admin/service-categories`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          id: liveTestCat,
          name: 'FDI Advisory',
          shortLabel: 'FDI',
          description: 'Foreign direct investment advisory',
          iconName: 'Globe',
          displayOrder: 10,
          isActive: true,
        }),
      });
      assert(resLivePost.status === 201, 'Live POST creates category with 201');

      // Live DELETE empty
      const resLiveDel = await fetch(`${baseUrl}/api/admin/service-categories/${liveTestCat}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      assert(resLiveDel.status === 200, 'Live DELETE empty category returns 200');
    }

  } finally {
    server.close();
    await closeDatabasePool();
  }

  console.log('\n================================================================');
  console.log(`STAGE 6B-E1 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStageE1Verification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
