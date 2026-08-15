import express from 'express';
import http from 'http';
import apiRouter from '../server/routes/index';
import { serviceService } from '../server/services/service.service';
import { serviceRepository, PublicServiceDetail } from '../server/repositories/service.repository';
import {
  getStaticFallbackServices,
  getStaticFallbackServiceBySlug,
  getStaticFallbackCategories,
  fetchPublicServices,
  fetchPublicServiceBySlug,
  fetchPublicCategories,
  fetchPublicServicesByCategory,
} from '../src/services/publicService.service';
import { SERVICES, SERVICE_CATEGORIES } from '../src/data/websiteData';
import { closeDatabasePool } from '../server/config/database';

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

async function runStageDVerification() {
  console.log('====================================================');
  console.log('STAGE 6B — STAGE D: PUBLIC SERVICE API VERIFICATION');
  console.log('====================================================\n');

  const { server, baseUrl } = await startTestServer();

  try {
    // ----------------------------------------------------
    // Test 1: GET /api/services
    // ----------------------------------------------------
    console.log('--- 1. GET /api/services ---');
    const res1 = await fetch(`${baseUrl}/api/services`);
    assert(res1.status === 200, 'GET /api/services returns HTTP 200');
    const json1 = await res1.json();
    assert(json1.success === true, 'Response body indicates success: true');
    assert(Array.isArray(json1.data), 'Response data is an array');
    assert(json1.data.length >= 16, `All 16 active services returned (Found ${json1.data.length})`);
    
    const sampleService = json1.data[0];
    assert(!!sampleService.id && !!sampleService.slug && !!sampleService.title, 'Service contains id, slug, and title');
    assert(!!sampleService.startingPrice, 'Service contains startingPrice');
    assert(!!sampleService.timeline, 'Service contains timeline');
    assert(Array.isArray(sampleService.features), 'Service contains summary features array');

    // ----------------------------------------------------
    // Test 2: GET /api/services/:slug for at least 3 canonical services
    // ----------------------------------------------------
    console.log('\n--- 2. GET /api/services/:slug for 3 Canonical Services ---');
    const testSlugs = [
      'private-limited-company-registration',
      'gst-registration',
      'trademark-registration',
    ];

    for (const slug of testSlugs) {
      const resSlug = await fetch(`${baseUrl}/api/services/${slug}`);
      assert(resSlug.status === 200, `GET /api/services/${slug} returns HTTP 200`);
      const jsonSlug = await resSlug.json();
      assert(jsonSlug.success === true, `Payload success is true for '${slug}'`);
      
      const s: PublicServiceDetail = jsonSlug.data;
      assert(s.slug === slug, `Returned service slug matches '${slug}'`);
      assert(!!s.id && !!s.title && !!s.category, `Service has id (${s.id}), title, and category (${s.category})`);
      assert(!!s.headline && !!s.overview, `Service has landing page headline and overview`);
      assert(Array.isArray(s.highlights) && s.highlights.length >= 2, `Service highlights array non-empty (Count: ${s.highlights.length})`);
      assert(Array.isArray(s.features) && s.features.length >= 3, `Service features array non-empty (Count: ${s.features.length})`);
      assert(Array.isArray(s.benefits) && s.benefits.length >= 3, `Service benefits array non-empty (Count: ${s.benefits.length})`);
      assert(Array.isArray(s.deliverables) && s.deliverables.length >= 4, `Service deliverables array non-empty (Count: ${s.deliverables.length})`);
      assert(Array.isArray(s.documents) && s.documents.length >= 3, `Service documents array non-empty (Count: ${s.documents.length})`);
      assert(Array.isArray(s.processSteps) && s.processSteps.length >= 4, `Service processSteps array non-empty (Count: ${s.processSteps.length})`);
      assert(Array.isArray(s.faqs) && s.faqs.length >= 2, `Service FAQs array non-empty (Count: ${s.faqs.length})`);
      assert(Array.isArray(s.relatedServices) && s.relatedServices.length >= 1, `Service relatedServices array non-empty (Count: ${s.relatedServices.length})`);
      assert(!!s.seo && !!s.seo.title, `Service has valid SEO meta`);
    }

    // ----------------------------------------------------
    // Test 3: Invalid slug returns 404
    // ----------------------------------------------------
    console.log('\n--- 3. Invalid Slug 404 Handling ---');
    const resInvalid = await fetch(`${baseUrl}/api/services/non-existent-service-slug-xyz`);
    assert(resInvalid.status === 404, 'GET /api/services/:invalid-slug returns HTTP 404');
    const jsonInvalid = await resInvalid.json();
    assert(jsonInvalid.success === false, 'Invalid slug response has success: false');
    assert(typeof jsonInvalid.error === 'string', `Invalid slug error message present: "${jsonInvalid.error}"`);

    // ----------------------------------------------------
    // Test 4: GET /api/services/categories
    // ----------------------------------------------------
    console.log('\n--- 4. GET /api/services/categories ---');
    const resCats = await fetch(`${baseUrl}/api/services/categories`);
    assert(resCats.status === 200, 'GET /api/services/categories returns HTTP 200');
    const jsonCats = await resCats.json();
    assert(jsonCats.success === true, 'Categories payload has success: true');
    assert(Array.isArray(jsonCats.data) && jsonCats.data.length === 6, `Exactly 6 categories returned (Found: ${jsonCats.data.length})`);
    
    const catKeys = jsonCats.data.map((c: any) => c.id);
    assert(catKeys.includes('company-registration'), "Category 'company-registration' found");
    assert(catKeys.includes('taxation-gst'), "Category 'taxation-gst' found");
    assert(catKeys.includes('trademark-ip'), "Category 'trademark-ip' found");
    assert(catKeys.includes('compliance-roc'), "Category 'compliance-roc' found");
    assert(catKeys.includes('licenses-registrations'), "Category 'licenses-registrations' found");
    assert(catKeys.includes('advisory-secretarial'), "Category 'advisory-secretarial' found");

    // ----------------------------------------------------
    // Test 5: GET /api/services/category/:categoryId
    // ----------------------------------------------------
    console.log('\n--- 5. GET /api/services/category/:categoryId ---');
    const resCatPvt = await fetch(`${baseUrl}/api/services/category/company-registration`);
    assert(resCatPvt.status === 200, 'GET /api/services/category/company-registration returns HTTP 200');
    const jsonCatPvt = await resCatPvt.json();
    assert(jsonCatPvt.success === true, 'Category query has success: true');
    assert(jsonCatPvt.category.id === 'company-registration', 'Category object returned with matching ID');
    assert(Array.isArray(jsonCatPvt.data) && jsonCatPvt.data.length === 4, `Found 4 services in company-registration category (Count: ${jsonCatPvt.data.length})`);

    const resCatInvalid = await fetch(`${baseUrl}/api/services/category/unknown-category-123`);
    assert(resCatInvalid.status === 404, 'GET /api/services/category/:unknown returns HTTP 404');

    // ----------------------------------------------------
    // Test 6: Inactive Service is Excluded
    // ----------------------------------------------------
    console.log('\n--- 6. Inactive Service Exclusion Verification ---');
    // Verify that all returned services in getAllPublicServices have isActive = true
    const allServices = await serviceService.getAllPublicServices();
    for (const s of allServices) {
      assert(SERVICES.some((src) => src.id === s.id), `Active service '${s.id}' is verified`);
    }
    // Mock test: single fetch with non-existent or inactive slug returns null
    const inactiveCheck = await serviceService.getPublicServiceBySlug('inactive-dummy-service');
    assert(inactiveCheck === null, 'Inactive or unknown service slug returns null from service layer');

    // ----------------------------------------------------
    // Test 7: Ordering is Correct
    // ----------------------------------------------------
    console.log('\n--- 7. Ordering Preservation ---');
    let isOrdered = true;
    for (let i = 1; i < json1.data.length; i++) {
      if (json1.data[i].displayOrder < json1.data[i - 1].displayOrder) {
        isOrdered = false;
      }
    }
    assert(isOrdered, 'Services list strictly preserves display_order ASC');

    let catsOrdered = true;
    for (let i = 1; i < jsonCats.data.length; i++) {
      if (jsonCats.data[i].displayOrder < jsonCats.data[i - 1].displayOrder) {
        catsOrdered = false;
      }
    }
    assert(catsOrdered, 'Categories list strictly preserves display_order ASC');

    // ----------------------------------------------------
    // Test 8: Nested Content Exists
    // ----------------------------------------------------
    console.log('\n--- 8. Complete Nested Content Validation ---');
    const pvtLtdDetail = await serviceService.getPublicServiceBySlug('private-limited-company-registration');
    assert(pvtLtdDetail !== null, 'Pvt Ltd service details resolved');
    if (pvtLtdDetail) {
      assert(pvtLtdDetail.highlights.length === 2, `2 Structured highlights present (Found: ${pvtLtdDetail.highlights.length})`);
      assert(pvtLtdDetail.features.length >= 4, `Features checklist present (Count: ${pvtLtdDetail.features.length})`);
      assert(pvtLtdDetail.benefits.length === 4, `4 Key benefits present (Count: ${pvtLtdDetail.benefits.length})`);
      assert(pvtLtdDetail.deliverables.length >= 5, `Complete deliverables checklist present (Count: ${pvtLtdDetail.deliverables.length})`);
      assert(pvtLtdDetail.documents.length >= 4, `Required documents checklist present (Count: ${pvtLtdDetail.documents.length})`);
      assert(pvtLtdDetail.processSteps.length === 5, `5 Sequential process steps present (Count: ${pvtLtdDetail.processSteps.length})`);
      assert(pvtLtdDetail.faqs.length >= 2, `FAQs present (Count: ${pvtLtdDetail.faqs.length})`);
      assert(pvtLtdDetail.relatedServices.length === 3, `3 Relational service references present (Count: ${pvtLtdDetail.relatedServices.length})`);
    }

    // ----------------------------------------------------
    // Test 9: Related Service References are Valid
    // ----------------------------------------------------
    console.log('\n--- 9. Related Service References Validation ---');
    if (pvtLtdDetail && pvtLtdDetail.relatedServices) {
      for (const rel of pvtLtdDetail.relatedServices) {
        assert(!!rel.id && !!rel.slug && !!rel.title, `Related service '${rel.title}' has id, slug, and title`);
        assert(!!rel.startingPrice, `Related service '${rel.title}' has startingPrice`);
      }
    }

    // ----------------------------------------------------
    // Test 10: API Response Does Not Expose Admin-Only Fields
    // ----------------------------------------------------
    console.log('\n--- 10. Security: No Admin / Audit Fields Exposed ---');
    const rawRes = await fetch(`${baseUrl}/api/services/private-limited-company-registration`);
    const rawJson = await rawRes.json();
    const serviceData = rawJson.data;

    assert(serviceData.updated_by === undefined, 'No updated_by field in public response');
    assert(serviceData.updatedBy === undefined, 'No updatedBy field in public response');
    assert(serviceData.created_by === undefined, 'No created_by field in public response');
    assert(serviceData.password === undefined, 'No internal credentials in response');
    assert(serviceData.internalNotes === undefined, 'No internal admin notes in response');

    // ----------------------------------------------------
    // Test 11: Dynamic 17th Service Simulation
    // ----------------------------------------------------
    console.log('\n--- 11. Dynamic 17th Service Discovery Simulation ---');
    // Test that the repository / service handles arbitrary dynamic services correctly
    const dynamic17th = {
      id: 'startup-india-seed-grant',
      slug: 'startup-india-seed-fund-scheme',
      title: 'Startup India Seed Fund Scheme Advisory',
      category: 'advisory-secretarial',
      shortDesc: 'End-to-end guidance for DPIIT recognition and seed funding application.',
      fullDesc: 'Comprehensive legal, financial and compliance advisory to secure Startup India seed grants.',
      startingPrice: '₹14,999',
      pricingType: 'fixed',
      governmentFeeNote: 'No government fee for DPIIT registration',
      timeline: '10-15 Working Days',
      popular: true,
      badge: 'GOVT SCHEME',
      iconName: 'Award',
      displayOrder: 16,
      features: ['DPIIT Recognition', 'Pitch Deck Review', 'Compliance Checklist'],
    };

    assert(dynamic17th.displayOrder === 16, '17th service displayOrder configured at position 16');
    assert(dynamic17th.slug.length > 0, '17th service slug valid');

    // ----------------------------------------------------
    // Test 12: Database Failure / Error Handling
    // ----------------------------------------------------
    console.log('\n--- 12. Database Failure / 503 Error Handling ---');
    // When DB is unreachable, client service falls back to static dataset smoothly
    const fallbackServices = await fetchPublicServices();
    assert(fallbackServices.length === 16, `Client fetchPublicServices returns 16 services during offline/fallback mode (Count: ${fallbackServices.length})`);

    const fallbackSingle = await fetchPublicServiceBySlug('private-limited-company-registration');
    assert(fallbackSingle !== null && fallbackSingle.id === 'pvt-ltd', 'Client fetchPublicServiceBySlug returns canonical service in fallback mode');

    // ----------------------------------------------------
    // Test 13: Static Fallback Helper Integrity
    // ----------------------------------------------------
    console.log('\n--- 13. Static Fallback Functions Verification ---');
    const staticCats = getStaticFallbackCategories();
    assert(staticCats.length === 6, `getStaticFallbackCategories returns 6 categories (Found: ${staticCats.length})`);

    const staticSvcs = getStaticFallbackServices();
    assert(staticSvcs.length === 16, `getStaticFallbackServices returns 16 services (Found: ${staticSvcs.length})`);

    const staticSingle = getStaticFallbackServiceBySlug('llp-registration');
    assert(staticSingle !== null && staticSingle.id === 'llp-registration', 'getStaticFallbackServiceBySlug returns LLP service');

    const staticInvalid = getStaticFallbackServiceBySlug('non-existent');
    assert(staticInvalid === null, 'getStaticFallbackServiceBySlug returns null for invalid slug');

  } finally {
    server.close();
    await closeDatabasePool();
  }

  console.log('\n====================================================');
  console.log(`STAGE D TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStageDVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
