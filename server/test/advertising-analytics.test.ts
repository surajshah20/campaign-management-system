import assert from 'assert';
import { AuthService } from '../src/services/auth.service';
import { ClientService } from '../src/services/client.service';
import { CampaignService } from '../src/services/campaign.service';
import { AdvertisingService } from '../src/services/advertising.service';
import { AnalyticsService } from '../src/services/analytics.service';
import { prisma } from '../src/db/prisma';

async function runAdvertisingAndAnalyticsTests() {
  console.log('--- RUNNING AGENCY OS PHASE 5 ADVERTISING & ANALYTICS TESTS ---');

  // 1. Setup Agency & Client
  const ownerResult = await AuthService.register({
    email: `ads.tester.${Date.now()}@agency.com`,
    password: 'Password123!',
    firstName: 'Media',
    lastName: 'Director',
    agencyName: 'Horizon Media Ventures',
  });

  const agencyId = ownerResult.currentAgency!.id;
  const userId = ownerResult.user.id;

  const client = await ClientService.createClient(agencyId, userId, {
    name: 'Kathmandu Craft Distillers',
    industry: 'Beverages',
  });

  const campaign = await CampaignService.createCampaign(agencyId, userId, {
    clientId: client.id,
    name: 'Artisan Gin Summer Launch',
    allocatedBudget: 200000,
  });

  // Test 1: Create Ad Account
  console.log('[Test 1] Testing Ad Account Creation...');
  const adAccount = await AdvertisingService.createAccount(agencyId, {
    platform: 'META_ADS',
    accountName: 'Horizon Meta Business Portfolio',
    externalId: 'act_98234710293',
  });
  assert(adAccount.id, 'Ad Account must have an ID');
  assert.strictEqual(adAccount.platform, 'META_ADS');
  console.log('✓ Test 1 Passed: Ad account created.');

  // Test 2: Create Ad Campaign
  console.log('[Test 2] Testing Paid Ad Campaign Creation...');
  const adCamp = await AdvertisingService.createAdCampaign(agencyId, userId, {
    campaignId: campaign.id,
    adAccountId: adAccount.id,
    name: 'Meta Video Views & Story Ads',
    platform: 'META_ADS',
    budgetAmount: 100000,
  });
  assert(adCamp.id, 'Ad Campaign must have an ID');
  assert.strictEqual(adCamp.name, 'Meta Video Views & Story Ads');
  console.log('✓ Test 2 Passed: Ad campaign created.');

  // Test 3: Manual Metric Logging
  console.log('[Test 3] Testing Metric Logging & ROAS Calculation...');
  const today = new Date();
  const d1 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d2 = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d3 = today.toISOString().split('T')[0];

  const metric = await AdvertisingService.logMetric(agencyId, userId, {
    adCampaignId: adCamp.id,
    date: d1,
    impressions: 12500,
    reach: 9800,
    clicks: 420,
    spend: 15000,
    conversions: 18,
    revenue: 45000,
  });
  assert.strictEqual(metric.roas, 3.0); // 45000 / 15000 = 3.0x
  assert.strictEqual(metric.clicks, 420);
  console.log('✓ Test 3 Passed: Daily metric logged with automatic ROAS calculation.');

  // Test 4: CSV Metrics Ingestion
  console.log('[Test 4] Testing CSV Batch Metrics Ingestion...');
  const sampleCsv = `date,impressions,reach,clicks,spend,conversions,revenue
${d2},15000,11000,520,18000,24,62000
${d3},18500,13500,610,21000,29,78000`;

  const csvResult = await AdvertisingService.ingestCsvMetrics(
    agencyId,
    userId,
    adCamp.id,
    sampleCsv
  );
  assert.strictEqual(csvResult.recordsCreated, 2);
  assert.strictEqual(csvResult.totalSpendAdded, 39000);
  console.log('✓ Test 4 Passed: CSV parsed and ingested batch metrics.');

  // Test 5: Analytics Overview Aggregation
  console.log('[Test 5] Testing Full Analytics Overview Aggregation...');
  const analytics = await AnalyticsService.getOverviewAnalytics(agencyId, { days: 30 });
  assert(analytics.summary.totalSpend >= 54000);
  assert(analytics.summary.overallRoas > 0);
  assert(analytics.timeseries.length >= 3);
  assert(analytics.platformComparison.length >= 1);
  console.log('✓ Test 5 Passed: Analytics aggregated with timeseries & platform breakdown.');

  // Cleanup
  await prisma.agency.delete({ where: { id: agencyId } });

  console.log('--- ALL PHASE 5 TESTS PASSED (5/5) ---');
}

runAdvertisingAndAnalyticsTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
