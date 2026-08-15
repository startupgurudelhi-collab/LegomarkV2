import { getDatabase, closeDatabasePool, pingDatabase } from '../server/config/database';
import { adminUsers, adminSessions, packages, packageFeatures } from '../db/schema/index';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const TEMP_PACKAGE_ID = 'ui-test-corp';

async function runTests() {
  console.log('\n==================================================');
  console.log('  LEGOMARK INDIA — STAGE 5B ADMIN UI & API TEST');
  console.log('==================================================\n');

  const dbStatus = await pingDatabase();
  if (!dbStatus.connected) {
    console.warn(`[NOTICE] PostgreSQL is currently offline in this environment (${dbStatus.error}).`);
    return;
  }

  const db = getDatabase();

  // 1. Create or find test admin user
  const email = 'admin-ui-test@legomark.in';
  const password = 'TestAdminPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  let [testUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (!testUser) {
    const [newUser] = await db
      .insert(adminUsers)
      .values({
        email,
        passwordHash,
        fullName: 'Stage 5B Test Administrator',
        role: 'ADMIN',
        isActive: true,
      })
      .returning();
    testUser = newUser;
    console.log('✓ Created test admin user for UI validation');
  }

  // 2. Perform actual HTTP Login via POST /api/auth/login
  console.log('1. Logging in via POST /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No Set-Cookie header received upon login');
  }
  const rawCookie = setCookie.split(';')[0];
  console.log(`✓ Admin logged in successfully. User: ${loginData.data.user.email} (${loginData.data.user.role})`);

  // 3. Verify /api/auth/me
  console.log('\n2. Verifying /api/auth/me...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: rawCookie },
  });
  const meData = await meRes.json();
  if (!meRes.ok || !meData.success || meData.data?.user?.email !== email) {
    throw new Error(`/api/auth/me check failed: ${JSON.stringify(meData)}`);
  }
  console.log(`✓ Session verified for: ${meData.data.user.fullName}`);

  // 4. Fetch packages via GET /api/admin/packages
  console.log('\n3. Fetching database packages via GET /api/admin/packages...');
  const getPkgsRes = await fetch(`${BASE_URL}/api/admin/packages`, {
    headers: { Cookie: rawCookie },
  });
  const getPkgsData = await getPkgsRes.json();
  console.log(`✓ Found ${getPkgsData.data.length} packages in database.`);

  // 5. Create new package
  console.log('\n4. Creating package via POST /api/admin/packages...');
  const createRes = await fetch(`${BASE_URL}/api/admin/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: rawCookie },
    body: JSON.stringify({
      id: TEMP_PACKAGE_ID,
      name: 'UI Corporate Launch Tier',
      tagline: 'All-inclusive legal setup tested from Admin UI',
      priceAmount: '12999.00',
      currency: 'INR',
      billingType: 'one_time',
      priceDisplayOverride: '₹12,999 All-Inclusive',
      idealFor: 'Mid-sized businesses scaling operations',
      popular: true,
      badge: 'Admin Featured',
      isActive: true,
      displayOrder: 3,
      features: [
        { featureText: 'Incorporation SPICe+ filing', displayOrder: 0 },
        { featureText: 'GST & PAN Registration', displayOrder: 1 },
        { featureText: 'Bank Account Assistance', displayOrder: 2 },
      ],
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Create failed: ${JSON.stringify(createData)}`);
  }
  console.log(`✓ Created: "${createData.data.name}" (ID: ${createData.data.id}) with ${createData.data.features.length} features`);

  // 6. Update package
  console.log('\n5. Updating package via PUT /api/admin/packages/:id...');
  const updateRes = await fetch(`${BASE_URL}/api/admin/packages/${TEMP_PACKAGE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: rawCookie },
    body: JSON.stringify({
      name: 'UI Corporate Launch Tier (Updated)',
      tagline: 'Updated tagline verified from Admin UI modal',
      priceAmount: '14999.00',
      currency: 'INR',
      billingType: 'one_time',
      priceDisplayOverride: '₹14,999 All-Inclusive',
      idealFor: 'Enterprises requiring priority fast-track processing',
      popular: true,
      badge: 'Best Value',
      isActive: true,
      displayOrder: 3,
      features: [
        { featureText: 'Incorporation SPICe+ filing', displayOrder: 0 },
        { featureText: 'GST & PAN Registration', displayOrder: 1 },
        { featureText: 'Bank Account Assistance', displayOrder: 2 },
        { featureText: 'Dedicated Corporate Legal Advisor', displayOrder: 3 },
      ],
    }),
  });

  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success) {
    throw new Error(`Update failed: ${JSON.stringify(updateData)}`);
  }
  console.log(`✓ Updated: "${updateData.data.name}", new feature count: ${updateData.data.features.length}`);

  // 7. Toggle status
  console.log('\n6. Toggling status to INACTIVE via PATCH /api/admin/packages/:id/status...');
  const statusRes = await fetch(`${BASE_URL}/api/admin/packages/${TEMP_PACKAGE_ID}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: rawCookie },
    body: JSON.stringify({ isActive: false }),
  });
  const statusData = await statusRes.json();
  console.log(`✓ Status updated: isActive = ${statusData.data.isActive}`);

  // 8. Delete test package
  console.log('\n7. Deleting package via DELETE /api/admin/packages/:id...');
  const deleteRes = await fetch(`${BASE_URL}/api/admin/packages/${TEMP_PACKAGE_ID}`, {
    method: 'DELETE',
    headers: { Cookie: rawCookie },
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok || !deleteData.success) {
    throw new Error(`Delete failed: ${JSON.stringify(deleteData)}`);
  }
  console.log('✓ Package and cascaded features deleted successfully');

  // 9. Clean up test user
  await db.delete(adminSessions).where(eq(adminSessions.userId, testUser.id));
  await db.delete(adminUsers).where(eq(adminUsers.id, testUser.id));
  await closeDatabasePool();

  console.log('\n==================================================');
  console.log('  STAGE 5B ADMIN UI & API INTEGRATION VALIDATED!  ');
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
