import { founderService } from '../server/services/founder.service';
import { officeService } from '../server/services/office.service';
import { COMPANY_PROFILE, PACKAGES, PACKAGE_MATRIX } from '../src/data/websiteData';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}${detail ? ` (${detail})` : ''}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    failCount++;
  }
}

async function runRegressionSuite() {
  console.log('====================================================');
  console.log('STAGE 6A REGRESSION & VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Check Founder Service & Fallback
  console.log('--- 1. Founder CMS Service Verification ---');
  const founder = await founderService.getPublicProfile();
  assert(founder !== null && typeof founder === 'object', 'Founder public profile returned valid object');
  assert(founder.name === 'Nomaan Rizvi', 'Founder name is genuine and preserved (Nomaan Rizvi)');
  assert(founder.designation === 'Founder & Managing Director', 'Founder designation is genuine (Founder & Managing Director)');
  assert(founder.organization === 'LEGOMARK INDIA', 'Organization is LEGOMARK INDIA');
  assert(Array.isArray(founder.coreAreas) && founder.coreAreas.length >= 4, 'Founder core areas intact');
  assert(founder.photoUrl === null || typeof founder.photoUrl === 'string', 'Photo asset reference format valid');

  // 2. Check Office Service & Fallback
  console.log('\n--- 2. Office CMS Service Verification ---');
  const office = await officeService.getPublicProfile();
  assert(office !== null && typeof office === 'object', 'Office public profile returned valid object');
  assert(office.name === 'LEGOMARK INDIA', 'Office entity name is LEGOMARK INDIA');
  assert(office.city === 'New Delhi', 'Office city is New Delhi');
  assert(office.pincode === '110025', 'Office pincode is 110025');
  assert(office.mobile === '+91 75308 47878', 'Mobile contact is +91 75308 47878');
  assert(office.landline === '011-45768289', 'Landline contact is 011-45768289');
  assert(office.email === 'info@legomarkindia.com', 'Email is info@legomarkindia.com');
  assert(Array.isArray(office.checklist) && office.checklist.length >= 4, 'Office checklist items intact');

  // 3. Check for Banned "Headquarters" Terminology
  console.log('\n--- 3. Headquarter Terminology Audit ---');
  const filesToAudit = [
    'src/components/founder/FounderSection.tsx',
    'src/components/office/OfficeSection.tsx',
    'src/components/layout/Header.tsx',
    'src/components/layout/Footer.tsx',
  ];

  for (const relPath of filesToAudit) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasHQ = /headquarters|headquarter|\bHQ\b/i.test(content);
    assert(!hasHQ, `No banned "Headquarters" or "HQ" found in ${relPath}`);
  }

  // 4. Check Protected Brand Media Rule
  console.log('\n--- 4. Protected Brand Media Rule Verification ---');
  // Check client logos & testimonials
  const clientLogosPath = path.resolve(process.cwd(), 'src/components/logos/ClientLogos.tsx');
  const clientLogosContent = fs.readFileSync(clientLogosPath, 'utf8');
  assert(!clientLogosContent.includes('placeholder.com') && !clientLogosContent.includes('unsplash.com'), 'Client logos do not use placeholder or fake stock URLs');

  const testimonialsPath = path.resolve(process.cwd(), 'src/components/testimonials/TestimonialsSection.tsx');
  const testimonialsContent = fs.readFileSync(testimonialsPath, 'utf8');
  assert(!testimonialsContent.includes('placeholder.com') && !testimonialsContent.includes('unsplash.com'), 'Testimonials do not use fake generated avatar URLs');

  // 5. Check Footer Credit
  console.log('\n--- 5. Footer Credit Verification ---');
  const footerPath = path.resolve(process.cwd(), 'src/components/layout/Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');
  assert(footerContent.includes('Designed & Developed by Creattivee'), 'Footer credit contains exact text "Designed & Developed by Creattivee"');

  // 6. Check Packages and Matrix Integrity
  console.log('\n--- 6. Packages & Comparison Matrix Integrity ---');
  assert(PACKAGES.length === 3, '3 canonical packages intact in catalog');
  assert(PACKAGE_MATRIX.length > 0, 'Package matrix comparison rows intact');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
