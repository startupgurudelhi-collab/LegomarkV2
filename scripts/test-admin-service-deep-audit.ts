import express from 'express';
import http from 'http';
import apiRouter from '../server/routes/index';
import { adminServiceService } from '../server/services/admin-service.service';
import { adminServiceRepository } from '../server/repositories/admin-service.repository';
import { serviceService } from '../server/services/service.service';
import { serviceCategoryService } from '../server/services/service-category.service';
import { packageService } from '../server/services/package.service';
import { founderService } from '../server/services/founder.service';
import { officeService } from '../server/services/office.service';
import { getDatabase, closeDatabasePool, pingDatabase } from '../server/config/database';
import {
  adminUsers,
  adminSessions,
  serviceCategories,
  services,
  serviceFeatures,
  serviceHighlights,
  serviceBenefits,
  serviceDeliverables,
  serviceDocuments,
  serviceProcessSteps,
  serviceFaqs,
  serviceRelatedServices,
} from '../db/schema/index';
import { eq, asc, count } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

async function main() {
  console.log('====================================================');
  console.log('LEGOMARK INDIA — STAGE 6B-E2 DEEP AUDIT & VERIFICATION');
  console.log('====================================================');

  const { server, baseUrl } = await startTestServer();
  const dbStatus = await pingDatabase();
  const hasLiveDb = dbStatus.connected;

  try {
    // ==================================================
    // AUDIT 1 — AUTHENTICATION
    // ==================================================
    console.log('\n--- AUDIT 1: AUTHENTICATION ---');
    
    // 1. Unauthenticated GET /api/admin/services is rejected
    const unauthGet = await fetch(`${baseUrl}/api/admin/services`);
    assert(unauthGet.status === 401, 'A1.1 Unauthenticated GET /api/admin/services rejected with HTTP 401', `Status: ${unauthGet.status}`);

    // 2. Unauthenticated POST is rejected
    const unauthPost = await fetch(`${baseUrl}/api/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'unauth-test' }),
    });
    assert(unauthPost.status === 401, 'A1.2 Unauthenticated POST /api/admin/services rejected with HTTP 401', `Status: ${unauthPost.status}`);

    // 3. Unauthenticated PUT is rejected
    const unauthPut = await fetch(`${baseUrl}/api/admin/services/pvt-ltd`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauth Title' }),
    });
    assert(unauthPut.status === 401, 'A1.3 Unauthenticated PUT /api/admin/services/:id rejected with HTTP 401', `Status: ${unauthPut.status}`);

    // 4. Unauthenticated PATCH status is rejected
    const unauthPatch = await fetch(`${baseUrl}/api/admin/services/pvt-ltd/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert(unauthPatch.status === 401, 'A1.4 Unauthenticated PATCH /api/admin/services/:id/status rejected with HTTP 401', `Status: ${unauthPatch.status}`);

    // 5. Unauthenticated PATCH reorder is rejected
    const unauthReorder = await fetch(`${baseUrl}/api/admin/services/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    assert(unauthReorder.status === 401, 'A1.5 Unauthenticated PATCH /api/admin/services/reorder rejected with HTTP 401', `Status: ${unauthReorder.status}`);

    // 6. Unauthenticated DELETE is rejected
    const unauthDel = await fetch(`${baseUrl}/api/admin/services/pvt-ltd`, {
      method: 'DELETE',
    });
    assert(unauthDel.status === 401, 'A1.6 Unauthenticated DELETE /api/admin/services/:id rejected with HTTP 401', `Status: ${unauthDel.status}`);

    // ==================================================
    // AUDIT 2 — EXISTING DATA INTEGRITY
    // ==================================================
    console.log('\n--- AUDIT 2: EXISTING DATA INTEGRITY ---');

    const canonicalServices = await adminServiceService.getAllServices();
    const categories = await serviceCategoryService.getAllCategories();

    assert(categories.length === 6, 'A2.1 Total Categories count is 6', `Count: ${categories.length}`);
    assert(canonicalServices.length === 16, 'A2.2 Total Canonical Services count is 16', `Count: ${canonicalServices.length}`);

    // Verify zero duplicate IDs
    const serviceIds = canonicalServices.map((s) => s.id);
    const uniqueServiceIds = new Set(serviceIds);
    assert(uniqueServiceIds.size === 16 && serviceIds.length === 16, 'A2.3 Zero duplicate service IDs', `Unique: ${uniqueServiceIds.size}`);

    // Verify zero duplicate Slugs
    const serviceSlugs = canonicalServices.map((s) => s.slug);
    const uniqueServiceSlugs = new Set(serviceSlugs);
    assert(uniqueServiceSlugs.size === 16 && serviceSlugs.length === 16, 'A2.4 Zero duplicate service Slugs', `Unique: ${uniqueServiceSlugs.size}`);

    // Verify zero invalid category references
    const categoryIdsSet = new Set(categories.map((c) => c.id));
    const allValidCatRefs = canonicalServices.every((s) => categoryIdsSet.has(s.categoryId) && s.category !== null);
    assert(allValidCatRefs, 'A2.5 Zero invalid category references across all 16 services');

    // ==================================================
    // AUDIT 5 — VALIDATION (OFFLINE & SERVICE LAYER)
    // ==================================================
    console.log('\n--- AUDIT 5: VALIDATION ---');

    // Invalid ID (spaces and uppercase)
    try {
      await adminServiceService.createService({
        id: 'INVALID ID WITH SPACES',
        slug: 'valid-slug',
        categoryId: 'company-registration',
        title: 'Test',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'fixed',
        timeline: '3 days',
        iconName: 'Building2',
      });
      assert(false, 'A5.1 Invalid ID rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, 'A5.1 Invalid ID rejected with 400', err.message);
    }

    // Invalid Slug
    try {
      await adminServiceService.createService({
        id: 'valid-id',
        slug: 'INVALID SLUG!',
        categoryId: 'company-registration',
        title: 'Test',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'fixed',
        timeline: '3 days',
        iconName: 'Building2',
      });
      assert(false, 'A5.2 Invalid Slug rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, 'A5.2 Invalid Slug rejected with 400', err.message);
    }

    // Empty Title
    try {
      await adminServiceService.createService({
        id: 'valid-id',
        slug: 'valid-slug',
        categoryId: 'company-registration',
        title: '',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'fixed',
        timeline: '3 days',
        iconName: 'Building2',
      });
      assert(false, 'A5.3 Empty Title rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, 'A5.3 Empty Title rejected with 400', err.message);
    }

    // Missing categoryId
    try {
      await adminServiceService.createService({
        id: 'valid-id',
        slug: 'valid-slug',
        categoryId: '',
        title: 'Valid Title',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'fixed',
        timeline: '3 days',
        iconName: 'Building2',
      });
      assert(false, 'A5.4 Missing CategoryId rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, 'A5.4 Missing CategoryId rejected with 400', err.message);
    }

    // Invalid / Non-existent categoryId
    try {
      await adminServiceService.createService({
        id: 'valid-id',
        slug: 'valid-slug',
        categoryId: 'non-existent-cat-xyz',
        title: 'Valid Title',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'fixed',
        timeline: '3 days',
        iconName: 'Building2',
      });
      assert(false, 'A5.5 Non-existent CategoryId rejected');
    } catch (err: any) {
      assert(err.statusCode === 404, 'A5.5 Non-existent CategoryId rejected with 404', err.message);
    }

    // Invalid pricingType
    try {
      await adminServiceService.createService({
        id: 'valid-id',
        slug: 'valid-slug',
        categoryId: 'company-registration',
        title: 'Valid Title',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'invalid-pricing' as any,
        timeline: '3 days',
        iconName: 'Building2',
      });
      assert(false, 'A5.6 Invalid PricingType rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, 'A5.6 Invalid PricingType rejected with 400', err.message);
    }

    // Negative displayOrder
    try {
      await adminServiceService.createService({
        id: 'valid-id',
        slug: 'valid-slug',
        categoryId: 'company-registration',
        title: 'Valid Title',
        shortDesc: 'Short desc',
        startingPrice: '₹1,999',
        pricingType: 'fixed',
        timeline: '3 days',
        iconName: 'Building2',
        displayOrder: -5,
      });
      assert(false, 'A5.7 Negative displayOrder rejected');
    } catch (err: any) {
      assert(err.statusCode === 400, 'A5.7 Negative displayOrder rejected with 400', err.message);
    }

    // ==================================================
    // AUDIT 9 — DYNAMIC COUNTS VERIFICATION
    // ==================================================
    console.log('\n--- AUDIT 9: DYNAMIC COUNTS ---');
    const pvtService = canonicalServices.find((s) => s.id === 'pvt-ltd');
    assert(pvtService !== undefined, 'A9.1 Found canonical Private Limited service');
    assert(
      pvtService?.counts !== undefined &&
      typeof pvtService.counts.featureCount === 'number' &&
      typeof pvtService.counts.highlightCount === 'number' &&
      typeof pvtService.counts.benefitCount === 'number' &&
      typeof pvtService.counts.deliverableCount === 'number' &&
      typeof pvtService.counts.documentCount === 'number' &&
      typeof pvtService.counts.processStepCount === 'number' &&
      typeof pvtService.counts.faqCount === 'number' &&
      typeof pvtService.counts.relatedServiceCount === 'number',
      'A9.2 All 8 relational child counts are dynamically present and structured',
      JSON.stringify(pvtService?.counts)
    );

    // ==================================================
    // AUDIT 13, 14, 15 — PUBLIC & REGRESSION SUITE
    // ==================================================
    console.log('\n--- AUDIT 13, 14, 15: PUBLIC APIS & REGRESSION ---');

    // GET /api/services
    const publicServices = await serviceService.getAllPublicServices();
    assert(publicServices.length === 16, 'A13.1 GET /api/services returns exactly 16 canonical services', `Count: ${publicServices.length}`);

    // GET /api/services/categories
    const publicCategories = await serviceCategoryService.getAllCategories();
    assert(publicCategories.length === 6, 'A13.2 GET /api/services/categories returns exactly 6 categories', `Count: ${publicCategories.length}`);

    // Canonical slug routes
    const pvtSlugRes = await serviceService.getPublicServiceBySlug('private-limited-company-registration');
    assert(pvtSlugRes !== null && pvtSlugRes.id === 'pvt-ltd', 'A13.3 Route /private-limited-company-registration resolves pvt-ltd');

    const gstSlugRes = await serviceService.getPublicServiceBySlug('gst-registration');
    assert(gstSlugRes !== null && gstSlugRes.id === 'gst-registration', 'A13.4 Route /gst-registration resolves gst-registration');

    const tmSlugRes = await serviceService.getPublicServiceBySlug('trademark-registration');
    assert(tmSlugRes !== null && tmSlugRes.id === 'trademark-registration', 'A13.5 Route /trademark-registration resolves trademark-registration');

    // Category dynamic counts
    const sumServiceCounts = publicCategories.reduce((sum, c) => sum + c.serviceCount, 0);
    assert(sumServiceCounts === 16, 'A14.1 Category service counts dynamically sum to 16 canonical services', `Sum: ${sumServiceCounts}`);

    // Packages & Profile Public endpoints
    const founderProfile = await founderService.getPublicProfile();
    assert(founderProfile !== null && typeof founderProfile.name === 'string', 'A15.1 Founder profile service remains functional');

    const officeProfile = await officeService.getPublicProfile();
    assert(officeProfile !== null && typeof officeProfile.city === 'string', 'A15.2 Office profile service remains functional');

    // ==================================================
    // LIVE POSTGRESQL CRUD & PERMISSIONS (AUDIT 3, 4, 6, 7, 8, 10, 11, 12, 18)
    // ==================================================
    if (!hasLiveDb) {
      console.log('\n\x1b[33m[NOTICE] Direct PostgreSQL connection not active in container environment. Verified schema and service layers.\x1b[0m');
    } else {
      console.log('\n--- LIVE DATABASE: AUDIT 3, 4, 6, 7, 8, 10, 11, 12, 18 ---');
      const db = getDatabase();

      // Create temporary Admin & Editor users and sessions
      const testAdminUserId = `test-admin-audit-${Date.now()}`;
      const testEditorUserId = `test-editor-audit-${Date.now()}`;
      const hash = await bcrypt.hash('AuditPass123!', 10);

      await db.insert(adminUsers).values({
        id: testAdminUserId,
        email: `admin_${Date.now()}@legomark.in`,
        passwordHash: hash,
        role: 'ADMIN',
        fullName: 'Audit Admin User',
        isActive: true,
      });

      await db.insert(adminUsers).values({
        id: testEditorUserId,
        email: `editor_${Date.now()}@legomark.in`,
        passwordHash: hash,
        role: 'EDITOR',
        fullName: 'Audit Editor User',
        isActive: true,
      });

      const testAdminSessionId = `test-sess-adm-${Date.now()}`;
      const testEditorSessionId = `test-sess-edt-${Date.now()}`;
      const adminToken = `test-token-adm-${Date.now()}`;
      const editorToken = `test-token-edt-${Date.now()}`;

      const expiresAt = new Date(Date.now() + 3600 * 1000);
      const tokenHashAdm = crypto.createHash('sha256').update(adminToken).digest('hex');
      const tokenHashEdt = crypto.createHash('sha256').update(editorToken).digest('hex');

      await db.insert(adminSessions).values({
        id: testAdminSessionId,
        userId: testAdminUserId,
        sessionTokenHash: tokenHashAdm,
        expiresAt,
      });

      await db.insert(adminSessions).values({
        id: testEditorSessionId,
        userId: testEditorUserId,
        sessionTokenHash: tokenHashEdt,
        expiresAt,
      });

      const auditServiceId = 'audit-test-service';
      const auditServiceSlug = 'audit-test-service';
      const auditServiceUpdatedSlug = 'audit-test-service-updated';

      try {
        // A1.7 ADMIN can access
        const adminGet = await fetch(`${baseUrl}/api/admin/services`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(adminGet.status === 200, 'A1.7 ADMIN can access /api/admin/services', `Status: ${adminGet.status}`);

        // A1.8 EDITOR can access
        const editorGet = await fetch(`${baseUrl}/api/admin/services`, {
          headers: { Authorization: `Bearer ${editorToken}` },
        });
        assert(editorGet.status === 200, 'A1.8 EDITOR can access /api/admin/services', `Status: ${editorGet.status}`);

        // AUDIT 3 — CREATE 17TH SERVICE
        const createPayload = {
          id: auditServiceId,
          slug: auditServiceSlug,
          categoryId: 'company-registration',
          title: 'Audit Test Service',
          shortDesc: 'Temporary audit service for testing.',
          fullDesc: 'Comprehensive full audit service description.',
          startingPrice: '₹4,999',
          pricingType: 'fixed',
          governmentFeeNote: 'Govt fees extra',
          timeline: '2–3 Days',
          popular: false,
          badge: null,
          iconName: 'Building2',
          displayOrder: 25,
          isActive: true,
          seoTitle: 'Audit Test Service | LEGOMARK INDIA',
          metaDescription: 'Meta description for audit test service',
        };

        const createRes = await fetch(`${baseUrl}/api/admin/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(createPayload),
        });
        assert(createRes.status === 201, 'A3.1 Create 17th service returned HTTP 201', `Status: ${createRes.status}`);
        const createData = await createRes.json();
        assert(createData.data && createData.data.id === auditServiceId, 'A3.2 Service ID is correct');
        assert(createData.data.slug === auditServiceSlug, 'A3.3 Slug is correct');
        assert(createData.data.categoryId === 'company-registration', 'A3.4 Category is correct');
        assert(createData.data.displayOrder === 25, 'A3.5 displayOrder is stored');
        assert(createData.data.isActive === true, 'A3.6 isActive is correct');

        // Verify total during test is 17
        const get17Res = await fetch(`${baseUrl}/api/admin/services`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const get17Data = await get17Res.json();
        assert(get17Data.data.length === 17, 'A3.7 Total services during test is exactly 17', `Count: ${get17Data.data.length}`);

        // AUDIT 4 — DUPLICATE PROTECTION
        const dupIdRes = await fetch(`${baseUrl}/api/admin/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ ...createPayload, slug: 'different-slug-xyz' }),
        });
        assert(dupIdRes.status === 409, 'A4.1 Duplicate ID rejected with HTTP 409', `Status: ${dupIdRes.status}`);

        const dupSlugRes = await fetch(`${baseUrl}/api/admin/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ ...createPayload, id: 'different-id-xyz' }),
        });
        assert(dupSlugRes.status === 409, 'A4.2 Duplicate Slug rejected with HTTP 409', `Status: ${dupSlugRes.status}`);

        // AUDIT 6 — UPDATE
        const updatePayload = {
          slug: auditServiceSlug,
          categoryId: 'company-registration',
          title: 'Audit Test Service (Updated Title)',
          shortDesc: 'Updated short description.',
          fullDesc: 'Updated full description.',
          startingPrice: '₹5,999',
          pricingType: 'fixed',
          governmentFeeNote: 'Updated fee note',
          timeline: '1–2 Days',
          popular: true,
          badge: 'Verified',
          iconName: 'ShieldCheck',
          displayOrder: 25,
          isActive: true,
        };

        const updateRes = await fetch(`${baseUrl}/api/admin/services/${auditServiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(updatePayload),
        });
        assert(updateRes.status === 200, 'A6.1 PUT update returned HTTP 200', `Status: ${updateRes.status}`);
        const updateData = await updateRes.json();
        assert(updateData.data.title === 'Audit Test Service (Updated Title)', 'A6.2 Database values changed');
        assert(updateData.data.id === auditServiceId, 'A6.3 Service ID did NOT change');

        // AUDIT 7 — SLUG CHANGE
        const changeSlugRes = await fetch(`${baseUrl}/api/admin/services/${auditServiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ ...updatePayload, slug: auditServiceUpdatedSlug }),
        });
        assert(changeSlugRes.status === 200, 'A7.1 Slug update returned HTTP 200');

        const newSlugPublic = await fetch(`${baseUrl}/api/services/${auditServiceUpdatedSlug}`);
        assert(newSlugPublic.status === 200, 'A7.2 Public GET with new slug works (HTTP 200)');

        const oldSlugPublic = await fetch(`${baseUrl}/api/services/${auditServiceSlug}`);
        assert(oldSlugPublic.status === 404, 'A7.3 Public GET with old slug returns HTTP 404');

        // AUDIT 8 — STATUS TOGGLE
        const deactivateRes = await fetch(`${baseUrl}/api/admin/services/${auditServiceId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ isActive: false }),
        });
        assert(deactivateRes.status === 200, 'A8.1 Status deactivation returned HTTP 200');

        const publicAfterDeactivate = await fetch(`${baseUrl}/api/services/${auditServiceUpdatedSlug}`);
        assert(publicAfterDeactivate.status === 404, 'A8.2 Inactive service does not resolve on public API');

        const reactivateRes = await fetch(`${baseUrl}/api/admin/services/${auditServiceId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ isActive: true }),
        });
        assert(reactivateRes.status === 200, 'A8.3 Status reactivation returned HTTP 200');

        const publicAfterReactivate = await fetch(`${baseUrl}/api/services/${auditServiceUpdatedSlug}`);
        assert(publicAfterReactivate.status === 200, 'A8.4 Reactivated service resolves on public API');

        // AUDIT 10 — CHILD CONTENT PRESERVATION
        const pvtBefore = await fetch(`${baseUrl}/api/admin/services/pvt-ltd`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const pvtBeforeData = await pvtBefore.json();
        const initialFeatureCount = pvtBeforeData.data.counts.featureCount;

        const updatePvtRes = await fetch(`${baseUrl}/api/admin/services/pvt-ltd`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            slug: pvtBeforeData.data.slug,
            categoryId: pvtBeforeData.data.categoryId,
            title: pvtBeforeData.data.title,
            shortDesc: pvtBeforeData.data.shortDesc,
            startingPrice: pvtBeforeData.data.startingPrice,
            pricingType: pvtBeforeData.data.pricingType,
            timeline: pvtBeforeData.data.timeline,
            iconName: pvtBeforeData.data.iconName,
          }),
        });
        assert(updatePvtRes.status === 200, 'A10.1 Metadata update on canonical service returned HTTP 200');
        const pvtAfterData = await updatePvtRes.json();
        assert(pvtAfterData.data.counts.featureCount === initialFeatureCount, 'A10.2 Child feature counts remain exactly preserved');

        // AUDIT 11 — REORDER
        const reorderRes = await fetch(`${baseUrl}/api/admin/services/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            items: [
              { id: 'pvt-ltd', displayOrder: 0 },
              { id: 'llp-registration', displayOrder: 1 },
              { id: auditServiceId, displayOrder: 2 },
            ],
          }),
        });
        assert(reorderRes.status === 200, 'A11.1 Reorder services returned HTTP 200');

        // AUDIT 12 — DELETE
        const deleteRes = await fetch(`${baseUrl}/api/admin/services/${auditServiceId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(deleteRes.status === 200, 'A12.1 DELETE temporary service returned HTTP 200');

        const verifyDelRes = await fetch(`${baseUrl}/api/admin/services/${auditServiceId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(verifyDelRes.status === 404, 'A12.2 Deleted service returns HTTP 404');

        // AUDIT 18 — FINAL DATA VERIFICATION
        const finalServicesRes = await fetch(`${baseUrl}/api/admin/services`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const finalServicesData = await finalServicesRes.json();
        assert(finalServicesData.data.length === 16, 'A18.1 Final canonical services count is exactly 16', `Count: ${finalServicesData.data.length}`);

        const finalCatsRes = await fetch(`${baseUrl}/api/admin/service-categories`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const finalCatsData = await finalCatsRes.json();
        assert(finalCatsData.data.length === 6, 'A18.2 Final canonical categories count is exactly 6', `Count: ${finalCatsData.data.length}`);
      } finally {
        // Cleanup all test users, sessions, and test services
        await db.delete(adminSessions).where(eq(adminSessions.id, testAdminSessionId));
        await db.delete(adminSessions).where(eq(adminSessions.id, testEditorSessionId));
        await db.delete(adminUsers).where(eq(adminUsers.id, testAdminUserId));
        await db.delete(adminUsers).where(eq(adminUsers.id, testEditorUserId));
        await db.delete(services).where(eq(services.id, auditServiceId));
      }
    }
  } catch (err) {
    console.error('Audit execution error:', err);
    failCount++;
  } finally {
    server.close();
    await closeDatabasePool();
    console.log('\n====================================================');
    console.log(`AUDIT TOTAL PASSED: ${passCount}`);
    console.log(`AUDIT TOTAL FAILED: ${failCount}`);
    console.log('====================================================');
    if (failCount > 0) {
      process.exit(1);
    }
  }
}

main();
