import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('LEGOMARK INDIA — CTA & NAVIGATION ARCHITECTURAL REGRESSION AUDIT');
console.log('======================================================\n');

// 1. Check Header.tsx
console.log('--- 1. HEADER NAVIGATION & LOGIN VERIFICATION ---');
const headerCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/Header.tsx'), 'utf8');

assert(
  headerCode.includes('href="/admin/login"') && headerCode.includes("onNavigatePath('/admin/login')"),
  'Desktop Header Login routes directly to /admin/login'
);

assert(
  !headerCode.includes("onOpenConsultation('Client Portal Login')"),
  'Header Login does NOT trigger onOpenConsultation'
);

assert(
  headerCode.includes('Book Free Consultation') && headerCode.includes('onOpenConsultation()'),
  'Header "Book Free Consultation" button correctly triggers onOpenConsultation()'
);

// 2. Check Footer.tsx
console.log('\n--- 2. FOOTER NAVIGATION & ADMIN PORTAL VERIFICATION ---');
const footerCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/Footer.tsx'), 'utf8');

assert(
  footerCode.includes('href="/admin/login"') && footerCode.includes("onNavigatePath('/admin/login')"),
  'Footer Admin Portal link routes directly to /admin/login'
);

assert(
  footerCode.includes('onNavigateSection') && footerCode.includes('onNavigateService'),
  'Footer retains direct section and service navigation handlers'
);

// 3. Check App.tsx
console.log('\n--- 3. APP.TSX CENTRAL ROUTER & MODAL STATE VERIFICATION ---');
const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');

assert(
  appCode.includes('handleNavigatePath') && appCode.includes("currentPath.startsWith('/admin')"),
  'App.tsx handles direct /admin route paths and renders AdminPortal'
);

assert(
  appCode.includes('<ConsultationModal') && appCode.includes('initialService={consultationService}'),
  'ConsultationModal receives specific service context when invoked'
);

// 4. Check Service CTA Components
console.log('\n--- 4. SERVICE-SPECIFIC CONSULTATION CTAs VERIFICATION ---');
const categorySpotlightsCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/services/CategorySpotlights.tsx'), 'utf8');
assert(
  categorySpotlightsCode.includes("onOpenConsultation('Private Limited Company Registration')") &&
  categorySpotlightsCode.includes("onOpenConsultation('Annual ROC Compliance')") &&
  categorySpotlightsCode.includes("onOpenConsultation('Trademark Registration')"),
  'CategorySpotlights preserve exact practice area title when triggering consultation'
);

const serviceLandingCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/services/ServiceLandingPage.tsx'), 'utf8');
assert(
  serviceLandingCode.includes('onOpenConsultation(service.title)'),
  'ServiceLandingPage retains current dynamic service.title context in consultation CTAs'
);

// 5. Check Package Matrix & Package CTAs
console.log('\n--- 5. PACKAGE & PRICING CONSULTATION CTAs VERIFICATION ---');
const packageSectionCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/packages/PackagesSection.tsx'), 'utf8');
assert(
  packageSectionCode.includes('onOpenConsultation(pkg.name)'),
  'PackagesSection passes package name context to consultation modal'
);

const packageMatrixCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/matrix/PackageMatrix.tsx'), 'utf8');
assert(
  packageMatrixCode.includes('onOpenConsultation(pkg.name)'),
  'PackageMatrix passes package name context to consultation modal'
);

console.log('\n======================================================');
console.log(`REGRESSION AUDIT SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
