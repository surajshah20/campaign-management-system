import assert from 'assert';
import { AuthService } from '../src/services/auth.service';
import { ClientService } from '../src/services/client.service';
import { SubscriptionService } from '../src/services/subscription.service';
import { prisma } from '../src/db/prisma';

async function runBillingAndSubscriptionTests() {
  console.log('--- RUNNING AGENCY OS PHASE 8 BILLING & COMMERCIAL SAAS TESTS ---');

  // Setup test tenant workspace
  const reg = await AuthService.register({
    email: `billing.tester.${Date.now()}@agency.com`,
    password: 'Password123!',
    firstName: 'Agency',
    lastName: 'Principal',
    agencyName: 'Apex Growth Marketing',
  });

  const agencyId = reg.currentAgency!.id;
  const userId = reg.user.id;

  // Test 1: Auto-provision Subscription with live quotas
  console.log('[Test 1] Testing Subscription Auto-Provisioning & Quota Calculation...');
  const subInfo = await SubscriptionService.getOrCreateSubscription(agencyId);
  assert(subInfo.subscription.id, 'Subscription must be created with ID');
  assert.strictEqual(subInfo.subscription.plan, 'GROWTH');
  assert.strictEqual(subInfo.subscription.status, 'ACTIVE');
  assert.strictEqual(subInfo.usage.clients.max, 15);
  assert.strictEqual(subInfo.usage.teamMembers.max, 20);
  console.log('✓ Test 1 Passed: Default Growth subscription provisioned with accurate quotas.');

  // Test 2: Check Quota Helper
  console.log('[Test 2] Testing Resource Quota Verifications...');
  const clientQuota = await SubscriptionService.checkQuota(agencyId, 'CLIENT');
  assert.strictEqual(clientQuota.allowed, true);
  assert.strictEqual(clientQuota.current, 0);
  assert.strictEqual(clientQuota.max, 15);
  console.log('✓ Test 2 Passed: Quota check returns correct bounds.');

  // Test 3: Payment Method Update
  console.log('[Test 3] Testing Payment Method Update...');
  const updatedCard = await SubscriptionService.updatePaymentMethod(agencyId, userId, {
    brand: 'Mastercard',
    last4: '9988',
    expMonth: '10',
    expYear: '29',
  });
  assert.strictEqual(updatedCard.paymentMethodBrand, 'Mastercard');
  assert.strictEqual(updatedCard.paymentMethodLast4, '9988');
  assert.strictEqual(updatedCard.paymentMethodExp, '10/29');
  console.log('✓ Test 3 Passed: Payment method updated securely.');

  // Test 4: Plan Upgrade to Enterprise with Invoice Generation
  console.log('[Test 4] Testing Plan Upgrade to Enterprise & Invoice Creation...');
  const upgradeResult = await SubscriptionService.changePlan(agencyId, userId, {
    plan: 'ENTERPRISE',
    billingCycle: 'ANNUAL',
  });
  assert.strictEqual(upgradeResult.subscription.plan, 'ENTERPRISE');
  assert.strictEqual(upgradeResult.subscription.billingCycle, 'ANNUAL');
  assert(upgradeResult.invoice.id, 'Invoice must be generated');
  assert.strictEqual(upgradeResult.invoice.status, 'PAID');
  assert(upgradeResult.invoice.amount > 0, 'Invoice amount must be positive');
  console.log('✓ Test 4 Passed: Plan upgraded and annual invoice generated.');

  // Test 5: Downgrade Guard when usage exceeds target tier limits
  console.log('[Test 5] Testing Downgrade Guard Enforcement...');
  // Create 4 clients (Starter limit is 3)
  for (let i = 1; i <= 4; i++) {
    await ClientService.createClient(agencyId, userId, {
      name: `Test Client ${i}`,
    });
  }

  let downgradeBlocked = false;
  try {
    await SubscriptionService.changePlan(agencyId, userId, {
      plan: 'STARTER',
    });
  } catch (err: any) {
    downgradeBlocked = true;
    assert(err.message.includes('maximum of 3'), 'Error should state maximum clients exceeded');
  }
  assert.strictEqual(downgradeBlocked, true, 'Downgrade must be blocked when clients exceed limits');
  console.log('✓ Test 5 Passed: Downgrade guard prevents switching to under-provisioned plan.');

  // Test 6: Subscription Cancellation & Resume Lifecycle
  console.log('[Test 6] Testing Cancellation & Resume Lifecycle...');
  const canceled = await SubscriptionService.cancelSubscription(agencyId, userId);
  assert.strictEqual(canceled.cancelAtPeriodEnd, true);

  const resumed = await SubscriptionService.resumeSubscription(agencyId, userId);
  assert.strictEqual(resumed.cancelAtPeriodEnd, false);
  console.log('✓ Test 6 Passed: Subscription cancellation and auto-renew restore verified.');

  // Test 7: Invoice History Retrieval
  console.log('[Test 7] Testing Billing Invoice History...');
  const invoices = await SubscriptionService.listInvoices(agencyId);
  assert(invoices.length >= 2, 'Should have at least 2 invoices generated');
  assert.strictEqual(invoices[0].currency, 'NPR');
  console.log('✓ Test 7 Passed: Invoices listed with complete financial ledger.');

  console.log('--- ALL PHASE 8 BILLING TESTS PASSED (7/7) ---');
}

runBillingAndSubscriptionTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
