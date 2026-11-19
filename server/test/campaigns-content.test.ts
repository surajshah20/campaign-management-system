import assert from 'assert';
import { AuthService } from '../src/services/auth.service';
import { ClientService } from '../src/services/client.service';
import { CampaignService } from '../src/services/campaign.service';
import { TaskService } from '../src/services/task.service';
import { ContentService } from '../src/services/content.service';
import { prisma } from '../src/db/prisma';

async function runCampaignsAndContentTests() {
  console.log('--- RUNNING AGENCY OS PHASE 3 & PHASE 4 TESTS ---');

  // Setup: Register Agency
  const ownerResult = await AuthService.register({
    email: `campaigns.test.${Date.now()}@agency.com`,
    password: 'Password123!',
    firstName: 'Campaign',
    lastName: 'Director',
    agencyName: 'Omni Media Global',
  });

  const agencyId = ownerResult.currentAgency!.id;
  const userId = ownerResult.user.id;

  // 1. Create Client
  const client = await ClientService.createClient(agencyId, userId, {
    name: 'Everest Gear Outfitters',
    industry: 'Outdoor Apparel',
    contactPerson: 'Pasang Sherpa',
  });

  // Test 1: Campaign Creation & Budget Allocation
  console.log('[Test 1] Testing Campaign Creation with allocated NPR budget...');
  const campaign = await CampaignService.createCampaign(agencyId, userId, {
    clientId: client.id,
    name: 'Winter Mountaineering Launch 2026',
    description: 'Hero product campaign for cold-weather insulated down jackets.',
    objective: 'Generate 1,000 online gear orders and boost retail brand recall.',
    campaignType: 'SOCIAL_MEDIA_MARKETING',
    status: 'PLANNING',
    allocatedBudget: 350000, // 350,000 NPR
    platforms: ['INSTAGRAM', 'FACEBOOK', 'TIKTOK'],
  });

  assert(campaign.id, 'Campaign ID must be created');
  assert.strictEqual(campaign.name, 'Winter Mountaineering Launch 2026');
  assert.strictEqual(campaign.allocatedBudget, 350000);
  console.log('✓ Test 1 Passed: Campaign created with budget and client link.');

  // Test 2: Task Creation & Kanban Status Updates
  console.log('[Test 2] Testing Task Lifecycle & Kanban status transitions...');
  const task = await TaskService.createTask(agencyId, userId, {
    title: 'Finalize mountaineering photoshoot shotlist',
    clientId: client.id,
    campaignId: campaign.id,
    priority: 'HIGH',
    status: 'TODO',
  });
  assert.strictEqual(task.status, 'TODO');

  const inProgressTask = await TaskService.updateTaskStatus(
    agencyId,
    task.id,
    userId,
    'IN_PROGRESS'
  );
  assert.strictEqual(inProgressTask.status, 'IN_PROGRESS');

  const completedTask = await TaskService.updateTaskStatus(
    agencyId,
    task.id,
    userId,
    'COMPLETED'
  );
  assert.strictEqual(completedTask.status, 'COMPLETED');
  console.log('✓ Test 2 Passed: Task created and moved through Kanban statuses.');

  // Test 3: Task Collaboration Comments
  console.log('[Test 3] Testing Task Comments...');
  const comment = await TaskService.addComment(
    agencyId,
    task.id,
    userId,
    'Uploaded revised outdoor location scouting sheets.'
  );
  assert.strictEqual(
    comment.content,
    'Uploaded revised outdoor location scouting sheets.'
  );
  console.log('✓ Test 3 Passed: Task comment recorded.');

  // Test 4: Content Studio & Version 1 Creation
  console.log('[Test 4] Testing Content Post Creation & Version 1...');
  const post = await ContentService.createPost(agencyId, userId, {
    clientId: client.id,
    campaignId: campaign.id,
    title: 'Summit Expedition Down Jacket Teaser',
    caption: 'Tested in the Himalayas at -30°C. Engineered for extreme warmth. #EverestGear',
    platform: 'INSTAGRAM',
    status: 'CLIENT_APPROVAL',
    mediaUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363',
    mediaType: 'image',
  });

  assert(post.id, 'Post ID must be created');
  assert.strictEqual(post.versions.length, 1);
  assert.strictEqual(post.versions[0].versionNumber, 1);
  const v1Approval = post.versions[0].approvals[0];
  assert(v1Approval, 'Approval record must be created when status is CLIENT_APPROVAL');
  assert.strictEqual(v1Approval.status, 'PENDING');
  console.log('✓ Test 4 Passed: Content Post created with V1 and pending approval record.');

  // Test 5: Client Approval Request Changes Loop
  console.log('[Test 5] Testing Client Change Request on V1...');
  await ContentService.reviewApproval(agencyId, v1Approval.id, userId, {
    status: 'CHANGES_REQUESTED',
    feedbackText: 'Please increase brand logo contrast on the lower right.',
  });

  const updatedPostV1 = await ContentService.getPostById(agencyId, post.id);
  assert.strictEqual(updatedPostV1.status, 'INTERNAL_REVIEW');
  console.log('✓ Test 5 Passed: Changes requested recorded with feedback text.');

  // Test 6: Iterating to Version 2 (Immutable History)
  console.log('[Test 6] Testing Iteration to Version 2 without overwriting V1...');
  const version2 = await ContentService.createNewVersion(agencyId, post.id, userId, {
    mediaUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b',
    captionCopy: 'Tested in the Himalayas at -30°C. Engineered for extreme warmth with high-vis accents. #EverestGear',
  });
  assert.strictEqual(version2.versionNumber, 2);

  const postWithV2 = await ContentService.getPostById(agencyId, post.id);
  assert.strictEqual(postWithV2.versions.length, 2);
  assert.strictEqual(postWithV2.versions[0].versionNumber, 2);
  assert.strictEqual(postWithV2.versions[1].versionNumber, 1);
  console.log('✓ Test 6 Passed: V2 created, preserving V1 intact in history.');

  // Test 7: Final Client Approval of V2
  console.log('[Test 7] Testing Final Client Approval of V2...');
  const v2Approval = postWithV2.versions[0].approvals[0];
  await ContentService.reviewApproval(agencyId, v2Approval.id, userId, {
    status: 'APPROVED',
    feedbackText: 'Looks outstanding, approved for publication!',
  });

  const finalApprovedPost = await ContentService.getPostById(agencyId, post.id);
  assert.strictEqual(finalApprovedPost.status, 'APPROVED');
  console.log('✓ Test 7 Passed: Post transitioned to APPROVED after client sign-off.');

  // Cleanup test agency
  await prisma.agency.delete({ where: { id: agencyId } });

  console.log('--- ALL PHASE 3 & PHASE 4 TESTS PASSED (7/7) ---');
}

runCampaignsAndContentTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
