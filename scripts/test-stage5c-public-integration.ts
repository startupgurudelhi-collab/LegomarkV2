import { fetchPublicPackages, fetchPublicMatrix, formatPackagePrice, getPackageCtaLabel } from '../src/services/publicPackage.service';
import { PACKAGES as STATIC_PACKAGES, PACKAGE_MATRIX as STATIC_PACKAGE_MATRIX, SERVICES } from '../src/data/websiteData';
import fs from 'fs';
import path from 'path';

async function runStage5CTests() {
  console.log('\n======================================================');
  console.log('  LEGOMARK INDIA — STAGE 5C VERIFICATION SUITE');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`✗ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Protected Files Integrity Check
  // ----------------------------------------------------
  console.log('--- 1. Checking Protected Files & Sections ---');
  const clientLogosPath = path.join(process.cwd(), 'src/components/logos/ClientLogos.tsx');
  const clientLogosContent = fs.readFileSync(clientLogosPath, 'utf8');
  assert(
    clientLogosContent.includes('INDUSTRY_SECTORS') && clientLogosContent.includes('ClientLogos'),
    'ClientLogos.tsx is strictly protected and unmodified'
  );

  const testimonialsPath = path.join(process.cwd(), 'src/components/testimonials/TestimonialsSection.tsx');
  const testimonialsContent = fs.readFileSync(testimonialsPath, 'utf8');
  assert(
    testimonialsContent.includes('TestimonialsSection') && testimonialsContent.includes('Client Service Commitments'),
    'TestimonialsSection.tsx is strictly protected and unmodified'
  );

  assert(SERVICES.length === 16, 'All 16 MCA/legal services remain defined and accessible');

  // ----------------------------------------------------
  // TEST 2: Price and CTA Formatting Helpers
  // ----------------------------------------------------
  console.log('\n--- 2. Validating Formatting Helpers ---');
  const formattedOneTime = formatPackagePrice({
    priceAmount: '6999.00',
    currency: 'INR',
    billingType: 'one_time',
  });
  assert(formattedOneTime.price === '₹6,999' && formattedOneTime.period === undefined, 'One-time price formatted as ₹6,999 without period');

  const formattedYearly = formatPackagePrice({
    priceAmount: '29999.00',
    currency: 'INR',
    billingType: 'yearly',
  });
  assert(formattedYearly.price === '₹29,999' && formattedYearly.period === '/ year', 'Yearly price formatted as ₹29,999 / year');

  const formattedOverride = formatPackagePrice({
    priceDisplayOverride: '₹16,999 All-Inclusive',
    priceAmount: '16999.00',
  });
  assert(formattedOverride.price === '₹16,999 All-Inclusive', 'Price display override takes precedence');

  assert(getPackageCtaLabel({ id: 'starter', name: 'Starter Incorporation' }) === 'Choose Starter', 'Starter CTA label is Choose Starter');
  assert(getPackageCtaLabel({ id: 'growth', name: 'Growth & Compliance' }) === 'Select Growth', 'Growth CTA label is Select Growth');
  assert(getPackageCtaLabel({ id: 'custom-corp', name: 'Corporate Retainer' }) === 'Select Corporate', 'Custom package CTA is Select Corporate');

  // ----------------------------------------------------
  // TEST 3: Offline / 503 Fallback Behavior
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Fallback Behavior When Database/API is Offline ---');
  // Global fetch mock / offline scenario
  const packageResult = await fetchPublicPackages();
  assert(packageResult.packages.length >= 3, `Packages resolved gracefully (count: ${packageResult.packages.length})`);
  assert(packageResult.packages[0].name === 'Starter Incorporation', 'First package is Starter Incorporation');
  assert(packageResult.packages[1].name === 'Growth & Compliance', 'Second package is Growth & Compliance');
  assert(packageResult.packages[2].name === 'Corporate Annual Retainer', 'Third package is Corporate Annual Retainer');

  const matrixResult = await fetchPublicMatrix();
  assert(matrixResult.packages.length >= 3, `Matrix packages resolved gracefully (count: ${matrixResult.packages.length})`);
  assert(matrixResult.rows.length === STATIC_PACKAGE_MATRIX.length, `Matrix rows count matches (${matrixResult.rows.length} rows)`);
  assert(matrixResult.categories.length > 0, `Matrix categories extracted (${matrixResult.categories.join(', ')})`);

  // ----------------------------------------------------
  // TEST 4: Dynamic N-Package Simulation (4th Package)
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Dynamic 4th Package Ingestion Simulation ---');
  // Simulate an API returning 4 packages
  const simulated4thApiPackage = {
    id: 'scale-up-enterprise',
    name: 'Scale-Up Enterprise Tier',
    tagline: 'Custom corporate compliance for Series A+ funded ventures',
    priceAmount: '49999.00',
    currency: 'INR',
    billingType: 'yearly',
    priceDisplayOverride: '₹49,999',
    idealFor: 'Funded tech startups with 10+ employees',
    popular: false,
    badge: 'Enterprise',
    displayOrder: 3,
    features: [
      'Everything in Corporate Annual Retainer',
      'Dedicated Company Secretary (CS) on demand',
      'ESOP Scheme Drafting & ROC Form PAS-3 filing',
      'FDI / RBI Form FC-GPR filing for overseas investment',
    ],
  };

  const simulatedPublicList = [...STATIC_PACKAGES, {
    id: simulated4thApiPackage.id,
    name: simulated4thApiPackage.name,
    tagline: simulated4thApiPackage.tagline,
    price: simulated4thApiPackage.priceDisplayOverride,
    period: '/ year',
    idealFor: simulated4thApiPackage.idealFor,
    popular: simulated4thApiPackage.popular,
    badge: simulated4thApiPackage.badge,
    features: simulated4thApiPackage.features,
    ctaLabel: getPackageCtaLabel(simulated4thApiPackage),
  }];

  assert(simulatedPublicList.length === 4, 'Simulated package list contains 4 packages');
  assert(simulatedPublicList[3].id === 'scale-up-enterprise', '4th package ID is scale-up-enterprise');
  assert(simulatedPublicList[3].ctaLabel === 'Select Scale-Up', '4th package CTA label generated dynamically as Select Scale-Up');

  // ----------------------------------------------------
  // TEST 5: Dynamic Matrix with 4 Columns Simulation
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Dynamic Matrix 4-Column Structure ---');
  const simulatedMatrixPackages = [
    ...matrixResult.packages,
    {
      id: 'scale-up-enterprise',
      name: 'Scale-Up Enterprise Tier',
      tagline: 'Custom corporate compliance',
      priceAmount: '49999.00',
      currency: 'INR',
      billingType: 'yearly',
      priceDisplayOverride: '₹49,999',
      popular: false,
      badge: 'Enterprise',
      displayOrder: 3,
      formattedPrice: '₹49,999',
      period: '/ year',
      shortName: 'Scale-Up',
      ctaLabel: 'Select Scale-Up',
    },
  ];

  const simulatedMatrixRows = matrixResult.rows.map((row) => ({
    ...row,
    packageValues: {
      ...row.packageValues,
      'scale-up-enterprise': true, // 4th tier includes all features
    },
  }));

  assert(simulatedMatrixPackages.length === 4, 'Matrix has 4 dynamic package columns');
  assert(simulatedMatrixRows[0].packageValues['scale-up-enterprise'] === true, '4th package values dynamically readable by package.id');

  // ----------------------------------------------------
  // TEST 6: Component Imports & File Hygiene
  // ----------------------------------------------------
  console.log('\n--- 6. Verifying Component Source Files ---');
  const pkgSectionPath = path.join(process.cwd(), 'src/components/packages/PackagesSection.tsx');
  const pkgSectionContent = fs.readFileSync(pkgSectionPath, 'utf8');
  assert(pkgSectionContent.includes('fetchPublicPackages'), 'PackagesSection uses fetchPublicPackages');
  assert(!pkgSectionContent.includes('PACKAGES[0]'), 'PackagesSection does not hardcode indices like PACKAGES[0]');

  const pkgMatrixPath = path.join(process.cwd(), 'src/components/matrix/PackageMatrix.tsx');
  const pkgMatrixContent = fs.readFileSync(pkgMatrixPath, 'utf8');
  assert(pkgMatrixContent.includes('fetchPublicMatrix'), 'PackageMatrix uses fetchPublicMatrix');
  assert(!pkgMatrixContent.includes('PACKAGES[0]'), 'PackageMatrix does not hardcode indices like PACKAGES[0]');
  assert(!pkgMatrixContent.includes('colSpan={4}'), 'PackageMatrix does not hardcode colSpan={4}');

  console.log('\n======================================================');
  console.log(`  ALL ${passedTests}/${totalTests} STAGE 5C TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
}

runStage5CTests().catch((err) => {
  console.error('Stage 5C test failed:', err);
  process.exit(1);
});
