import assert from 'assert';
import { ClientService } from '../src/services/client.service';
import { TeamService } from '../src/services/team.service';
import { AuthService } from '../src/services/auth.service';
import { prisma } from '../src/db/prisma';

async function runOperationsTests() {
  console.log('--- RUNNING AGENCY OS PHASE 2 OPERATIONS TESTS ---');

  // Setup: Create 2 isolated agencies with owners
  const agencyAUser = await AuthService.register({
    email: `agency.a.${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'AgencyA',
    lastName: 'Owner',
    agencyName: 'Agency Alpha Alpha',
  });

  const agencyBUser = await AuthService.register({
    email: `agency.b.${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'AgencyB',
    lastName: 'Owner',
    agencyName: 'Agency Beta Beta',
  });

  const agencyAId = agencyAUser.currentAgency!.id;
  const agencyBId = agencyBUser.currentAgency!.id;

  // Test 1: Client Creation under Agency A
  console.log('[Test 1] Testing Client Creation under Agency A...');
  const clientA = await ClientService.createClient(agencyAId, agencyAUser.user.id, {
    name: 'Kathmandu Specialty Roasters',
    industry: 'Hospitality',
    contactPerson: 'Bikram Thapa',
    email: 'bikram@kathmanduroasters.np',
    phone: '+977-9801234567',
    status: 'ACTIVE',
    internalNotes: 'Top coffee roaster in Patan.',
  });

  assert(clientA.id, 'Client must have an ID');
  assert.strictEqual(clientA.name, 'Kathmandu Specialty Roasters');
  assert.strictEqual(clientA.agencyId, agencyAId);
  console.log('✓ Test 1 Passed: Client created under Agency A.');

  // Test 2: Client Listing & Filtering under Agency A
  console.log('[Test 2] Testing Client Listing & Filtering...');
  const clientsList = await ClientService.listClients(agencyAId, { status: 'ACTIVE' });
  assert(clientsList.length >= 1);
  assert(clientsList.some((c) => c.id === clientA.id));
  console.log('✓ Test 2 Passed: Client list retrieved with active status filter.');

  // Test 3: Strict Tenant Isolation on Clients
  console.log('[Test 3] Testing Multi-Tenant Isolation for Clients...');
  let crossTenantLeak = false;
  try {
    // Agency B tries to fetch Agency A's client
    await ClientService.getClientById(agencyBId, clientA.id);
  } catch (err: any) {
    crossTenantLeak = true;
    assert.strictEqual(err.statusCode, 404);
  }
  assert(crossTenantLeak, 'Agency B must NOT be able to view Agency A’s client');

  const agencyBClients = await ClientService.listClients(agencyBId);
  assert(
    !agencyBClients.some((c) => c.id === clientA.id),
    'Agency A clients must not leak into Agency B client list'
  );
  console.log('✓ Test 3 Passed: Multi-tenant boundary holds for client CRM records.');

  // Test 4: Team Member Invitations
  console.log('[Test 4] Testing Team Member Invitations with Cryptographic Token...');
  const inviteResult = await TeamService.inviteMember(agencyAId, agencyAUser.user.id, {
    email: 'new.designer@apexdigital.com',
    role: 'DESIGNER',
  });
  assert(inviteResult.invitationId, 'Invitation ID must be returned');
  assert(inviteResult.inviteToken, 'Cryptographic invite token generated');
  assert.strictEqual(inviteResult.role, 'DESIGNER');

  const invitations = await TeamService.listInvitations(agencyAId);
  assert(invitations.length >= 1);
  console.log('✓ Test 4 Passed: Team member invited with secure token and role.');

  // Test 5: Sole Owner Demotion Protection
  console.log('[Test 5] Testing Sole Agency Owner Demotion Safety Guard...');
  const members = await TeamService.listMembers(agencyAId);
  const ownerMember = members.find((m) => m.role === 'AGENCY_OWNER');
  assert(ownerMember, 'Owner membership found');

  let soleOwnerProtected = false;
  try {
    await TeamService.updateMemberRole(
      agencyAId,
      ownerMember.membershipId,
      'DESIGNER',
      agencyAUser.user.id
    );
  } catch (err: any) {
    soleOwnerProtected = true;
    assert.strictEqual(err.statusCode, 400);
  }
  assert(soleOwnerProtected, 'Should prevent demoting the sole Agency Owner');
  console.log('✓ Test 5 Passed: Sole owner protected from accidental demotion.');

  // Test 6: Audit Log Integrity
  console.log('[Test 6] Testing Audit Log Recording...');
  const logs = await prisma.activityLog.findMany({
    where: { agencyId: agencyAId },
  });
  assert(logs.some((l) => l.action === 'CLIENT_CREATED'));
  assert(logs.some((l) => l.action === 'TEAM_MEMBER_INVITED'));
  console.log('✓ Test 6 Passed: Activity logs recorded for all operations.');

  // Cleanup test agencies
  await prisma.agency.delete({ where: { id: agencyAId } });
  await prisma.agency.delete({ where: { id: agencyBId } });

  console.log('--- ALL PHASE 2 OPERATIONS TESTS PASSED (6/6) ---');
}

runOperationsTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
