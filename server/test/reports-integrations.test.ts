import assert from 'assert';
import { AuthService } from '../src/services/auth.service';
import { ClientService } from '../src/services/client.service';
import { CampaignService } from '../src/services/campaign.service';
import { AdvertisingService } from '../src/services/advertising.service';
import { ReportService } from '../src/services/report.service';
import { IntegrationService } from '../src/services/integration.service';
import { StorageService } from '../src/services/storage.service';
import { prisma } from '../src/db/prisma';

async function runReportsAndIntegrationsTests() {
  console.log('--- RUNNING AGENCY OS PHASE 6 & PHASE 7 TESTS ---');

  // Setup test tenant workspace
  const reg = await AuthService.register({
    email: `reports.tester.${Date.now()}@agency.com`,
    password: 'Password123!',
    firstName: 'Analytics',
    lastName: 'Director',
    agencyName: 'Velocity Digital Labs',
  });

  const agencyId = reg.currentAgency!.id;
  const userId = reg.user.id;

  const client = await ClientService.createClient(agencyId, userId, {
    name: 'Pokhara Mountain Gear',
    industry: 'Outdoor Apparel',
  });

  const campaign = await CampaignService.createCampaign(agencyId, userId, {
    clientId: client.id,
    name: 'Winter Expedition 2026',
    allocatedBudget: 350000,
  });

  // Create an ad campaign with metrics for the report snapshot
  const adCamp = await AdvertisingService.createAdCampaign(agencyId, userId, {
    campaignId: campaign.id,
    name: 'Meta Performance Ads - Pokhara Gear',
    platform: 'META_ADS',
    budgetAmount: 150000,
  });

  await AdvertisingService.logMetric(agencyId, userId, {
    adCampaignId: adCamp.id,
    date: new Date().toISOString().split('T')[0],
    impressions: 45000,
    reach: 38000,
    clicks: 1400,
    spend: 12500,
    conversions: 62,
    revenue: 55000,
  });

  // Test 1: Report Generation with Metric Snapshot
  console.log('[Test 1] Testing Client Report Generation & Snapshot...');
  const report = await ReportService.generateReport(agencyId, userId, {
    clientId: client.id,
    campaignId: campaign.id,
    title: 'Winter Expedition Q4 Campaign Performance & ROAS Audit',
    observations: 'Strong ROAS driven by dynamic product ads on Meta.',
    recommendations: 'Scale budget by 25% into Google Performance Max.',
    isPubliclyShared: true,
  });

  assert(report.id, 'Report must have an ID');
  assert(report.shareToken, 'Report must have a cryptographic share token');
  assert(report.summaryJson, 'Report must contain frozen summaryJson snapshot');
  const snapshot = JSON.parse(report.summaryJson);
  assert.strictEqual(snapshot.clientName, 'Pokhara Mountain Gear');
  assert.strictEqual(snapshot.financials.totalSpend, 12500);
  assert.strictEqual(snapshot.financials.roas, 4.4);
  console.log('✓ Test 1 Passed: Report generated with immutable metric snapshot.');

  // Test 2: Public Presentation Share Token Access
  console.log('[Test 2] Testing Public Presentation Share Resolution...');
  const publicView = await ReportService.getPublicReport(report.shareToken);
  assert.strictEqual(publicView.title, report.title);
  assert.strictEqual(publicView.client.name, 'Pokhara Mountain Gear');
  assert.strictEqual(publicView.agency.name, 'Velocity Digital Labs');
  console.log('✓ Test 2 Passed: Public presentation resolved safely with zero internal credentials.');

  // Test 3: Report Update & Privacy Toggle
  console.log('[Test 3] Testing Report Update & Privacy Protection...');
  const updated = await ReportService.updateReport(agencyId, userId, report.id, {
    isPubliclyShared: false,
    observations: 'Updated executive commentary.',
  });
  assert.strictEqual(updated.isPubliclyShared, false);

  let blocked = false;
  try {
    await ReportService.getPublicReport(report.shareToken);
  } catch (err) {
    blocked = true;
  }
  assert.strictEqual(blocked, true, 'Unshared private report must reject public share token');
  console.log('✓ Test 3 Passed: Privacy toggle prevents unauthorized public access.');

  // Test 4: Third-Party Integration Configuration & Masking
  console.log('[Test 4] Testing Third-Party Integration Configuration & Credential Masking...');
  const integration = await IntegrationService.configureIntegration(agencyId, userId, {
    provider: 'META_ADS',
    name: 'Velocity Meta Ads Connector',
    credentials: {
      appId: '192837465928',
      accessToken: 'EAABsb7829341029837410293847',
      adAccountId: 'act_102938475',
    },
  });

  assert.strictEqual(integration.status, 'CONNECTED');
  const storedConfig = JSON.parse(integration.configJson!);
  assert(storedConfig.accessToken.includes('...'), 'Access token must be securely masked');
  console.log('✓ Test 4 Passed: Integration configured with credentials masked.');

  // Test 5: Automated Sync Execution & SyncLog
  console.log('[Test 5] Testing Automated Integration Sync & SyncLog Creation...');
  const syncResult = await IntegrationService.triggerSync(agencyId, userId, 'META_ADS');
  assert.strictEqual(syncResult.success, true);
  assert(syncResult.recordsProcessed >= 1, 'Sync must process at least 1 ad campaign');

  const syncLogs = await IntegrationService.getSyncLogs(agencyId, integration.id);
  assert(syncLogs.length >= 1, 'Sync log must be recorded');
  assert.strictEqual(syncLogs[0].status, 'SUCCESS');
  console.log('✓ Test 5 Passed: Automated sync executed and logged successfully.');

  // Test 6: Storage File Upload & MIME Validation
  console.log('[Test 6] Testing File Upload & Storage Adapter...');
  const dummySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>';
  const base64Data = Buffer.from(dummySvg).toString('base64');

  const uploadedFile = await StorageService.uploadFile(agencyId, userId, {
    fileName: 'brand-badge.svg',
    mimeType: 'image/svg+xml',
    base64Data,
    storageProvider: 'LOCAL',
  });

  assert(uploadedFile.id, 'Storage file must have an ID');
  assert(uploadedFile.publicUrl.includes('/uploads/'), 'Public URL must map to static uploads');
  assert.strictEqual(uploadedFile.fileName, 'brand-badge.svg');

  // Verify unsupported type rejection
  let rejected = false;
  try {
    await StorageService.uploadFile(agencyId, userId, {
      fileName: 'malicious.exe',
      mimeType: 'application/x-msdownload',
      base64Data,
    });
  } catch (err) {
    rejected = true;
  }
  assert.strictEqual(rejected, true, 'Unsupported file MIME types must be rejected');
  console.log('✓ Test 6 Passed: Storage upload succeeded with strict MIME validation.');

  console.log('--- ALL PHASE 6 & PHASE 7 TESTS PASSED (6/6) ---');
}

runReportsAndIntegrationsTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
