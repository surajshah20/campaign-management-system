import assert from 'assert';
import { AuthService } from '../src/services/auth.service';
import { WorkspaceService } from '../src/services/workspace.service';
import { prisma } from '../src/db/prisma';

async function runTests() {
  console.log('--- RUNNING AGENCY OS FOUNDATION TESTS ---');

  // Test 1: User Registration creates user and workspace atomically
  console.log('[Test 1] Testing Owner Registration & Automatic Agency Provisioning...');
  const testEmail = `test.owner.${Date.now()}@testagency.com`;
  const registerResult = await AuthService.register({
    email: testEmail,
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'Architect',
    agencyName: 'Velocity Creative Lab',
  });

  assert(registerResult.user.id, 'User ID must be returned');
  assert.strictEqual(registerResult.user.email, testEmail);
  assert(registerResult.currentAgency, 'Agency must be created for owner');
  assert.strictEqual(registerResult.currentAgency.name, 'Velocity Creative Lab');
  assert.strictEqual(registerResult.currentAgency.role, 'AGENCY_OWNER');
  assert(registerResult.token, 'Auth JWT token must be generated');
  console.log('✓ Test 1 Passed: User and workspace created atomically with AGENCY_OWNER role.');

  // Test 2: Login validation
  console.log('[Test 2] Testing User Authentication & Password Validation...');
  const loginResult = await AuthService.login({
    email: testEmail,
    password: 'SecurePassword123!',
  });
  assert.strictEqual(loginResult.user.id, registerResult.user.id);
  assert(loginResult.availableAgencies.length >= 1);
  console.log('✓ Test 2 Passed: Login successful with correct credentials.');

  // Test 3: Invalid login rejection
  console.log('[Test 3] Testing Bad Password Rejection...');
  let failed = false;
  try {
    await AuthService.login({
      email: testEmail,
      password: 'WrongPassword!',
    });
  } catch (err: any) {
    failed = true;
    assert.strictEqual(err.statusCode, 401);
  }
  assert(failed, 'Should have thrown 401 for bad password');
  console.log('✓ Test 3 Passed: Bad password rejected with 401.');

  // Test 4: Tenant Isolation Enforcement
  console.log('[Test 4] Testing Multi-Tenant Workspace Isolation...');
  const otherAgency = await prisma.agency.create({
    data: {
      name: 'Unrelated Competitor Agency',
      slug: `unrelated-${Date.now()}`,
      currency: 'USD',
    },
  });

  let unauthorizedAccessFailed = false;
  try {
    // Attempting to fetch details for an agency the user does not belong to
    await WorkspaceService.getWorkspaceDetails(otherAgency.id, registerResult.user.id);
  } catch (err: any) {
    unauthorizedAccessFailed = true;
    assert.strictEqual(err.statusCode, 404); // Or 403
  }
  assert(
    unauthorizedAccessFailed,
    'User must be prevented from reading workspace data of an agency they are not a member of'
  );
  console.log('✓ Test 4 Passed: Multi-tenant boundary verified. Cross-agency access blocked.');

  // Cleanup test agency
  await prisma.agency.delete({ where: { id: otherAgency.id } });

  console.log('--- ALL FOUNDATION TESTS PASSED (4/4) ---');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
