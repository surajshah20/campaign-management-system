import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding realistic demonstration data for Agency OS...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.approvalComment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.contentVersion.deleteMany();
  await prisma.contentPost.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.adMetric.deleteMany();
  await prisma.adCampaign.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.report.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.clientMember.deleteMany();
  await prisma.client.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.agencyMember.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const owner = await prisma.user.create({
    data: {
      email: 'owner@apexdigital.com',
      passwordHash,
      firstName: 'Aarav',
      lastName: 'Sharma',
      emailVerified: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@apexdigital.com',
      passwordHash,
      firstName: 'Pooja',
      lastName: 'Adhikari',
      emailVerified: true,
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: 'designer@apexdigital.com',
      passwordHash,
      firstName: 'Rohan',
      lastName: 'Shrestha',
      emailVerified: true,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@himalayancoffee.com',
      passwordHash,
      firstName: 'Siddhartha',
      lastName: 'Rana',
      emailVerified: true,
    },
  });

  // 2. Create Agency
  const agency = await prisma.agency.create({
    data: {
      name: 'Apex Digital Agency',
      slug: 'apex-digital',
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
    },
  });

  // 3. Create Agency Members
  await prisma.agencyMember.createMany({
    data: [
      { agencyId: agency.id, userId: owner.id, role: 'AGENCY_OWNER' },
      { agencyId: agency.id, userId: manager.id, role: 'CAMPAIGN_MANAGER' },
      { agencyId: agency.id, userId: designer.id, role: 'DESIGNER' },
    ],
  });

  // 4. Create Client
  const client = await prisma.client.create({
    data: {
      agencyId: agency.id,
      name: 'Himalayan Coffee Roasters',
      industry: 'Food & Beverage / E-Commerce',
      contactPerson: 'Siddhartha Rana',
      email: 'client@himalayancoffee.com',
      phone: '+977-1-4412345',
      website: 'https://himalayancoffee.com.np',
      assignedManagerId: manager.id,
      status: 'ACTIVE',
      internalNotes: '[SAMPLE DEMO DATA] Premium artisanal organic coffee brand from Pokhara & Kathmandu.',
    },
  });

  // Link client portal member
  await prisma.clientMember.create({
    data: {
      clientId: client.id,
      userId: clientUser.id,
      canApprove: true,
    },
  });

  // 5. Create Marketing Campaign
  const campaign = await prisma.campaign.create({
    data: {
      agencyId: agency.id,
      clientId: client.id,
      name: 'Spring Artisanal Cold Brew Launch 2026',
      description: 'Comprehensive omnichannel product rollout across Instagram, TikTok, and Meta Ads targeting young professionals.',
      objective: 'Drive brand awareness, generate 500+ direct online orders, and build retail cafe foot traffic.',
      campaignType: 'SOCIAL_MEDIA_MARKETING',
      status: 'ACTIVE',
      allocatedBudget: 250000,
      targetAudience: 'Urban consumers aged 21-42 in Kathmandu, Pokhara, Lalitpur interested in specialty coffee.',
      platformsJson: JSON.stringify(['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'META_ADS']),
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-04-30'),
    },
  });

  // 6. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        agencyId: agency.id,
        clientId: client.id,
        campaignId: campaign.id,
        assigneeId: designer.id,
        title: 'Design packaging hero renders for cold brew bottle',
        description: 'Prepare high-resolution 4K realistic 3D bottle mockups with vibrant summer labels.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        agencyId: agency.id,
        clientId: client.id,
        campaignId: campaign.id,
        assigneeId: manager.id,
        title: 'Review Meta Ad account conversion tracking pixels',
        description: 'Verify Shopify CAPI and GA4 events are capturing Add to Cart and Purchase conversions.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        agencyId: agency.id,
        clientId: client.id,
        campaignId: campaign.id,
        assigneeId: designer.id,
        title: 'Produce 15-second teaser reel for Instagram & TikTok',
        description: 'Dynamic fast-cut sequence showcasing brewing craft and ice pour.',
        priority: 'URGENT',
        status: 'IN_REVIEW',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 7. Create Content Post & Versions
  const post = await prisma.contentPost.create({
    data: {
      agencyId: agency.id,
      clientId: client.id,
      campaignId: campaign.id,
      creatorId: designer.id,
      title: 'Artisanal Cold Brew: Pure Steeped Perfection',
      caption: 'Slow-dripped for 18 hours using single-origin beans harvested from the misty hills of Nuwakot. Available this Friday at all cafes and online with free delivery nationwide. ☕✨ #HimalayanCoffee #ArtisanalColdBrew',
      platform: 'INSTAGRAM',
      status: 'CLIENT_APPROVAL',
      scheduledDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  const version1 = await prisma.contentVersion.create({
    data: {
      contentPostId: post.id,
      versionNumber: 1,
      mediaUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      captionCopy: post.caption,
      createdById: designer.id,
    },
  });

  await prisma.approval.create({
    data: {
      versionId: version1.id,
      clientId: client.id,
      status: 'PENDING',
      decisionNote: 'Awaiting Siddhartha’s sign-off on label typography.',
    },
  });

  // 8. Create Budget & Expenses
  const budget = await prisma.budget.create({
    data: {
      agencyId: agency.id,
      campaignId: campaign.id,
      allocatedAmount: 250000,
      advertisingSpend: 140000,
      productionCost: 45000,
      otherExpenses: 15000,
      currency: 'NPR',
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        budgetId: budget.id,
        category: 'PRODUCTION',
        amount: 45000,
        currency: 'NPR',
        description: 'Studio product photography and slow-motion video capture shoot',
      },
      {
        budgetId: budget.id,
        category: 'ADVERTISING',
        amount: 80000,
        currency: 'NPR',
        description: 'Meta Ads top-of-funnel video view ads',
      },
      {
        budgetId: budget.id,
        category: 'ADVERTISING',
        amount: 60000,
        currency: 'NPR',
        description: 'Google Search & PMax brand keywords campaign',
      },
    ],
  });

  // 9. Activity Log
  await prisma.activityLog.createMany({
    data: [
      {
        agencyId: agency.id,
        userId: owner.id,
        action: 'CAMPAIGN_LAUNCHED',
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        metadata: JSON.stringify({ campaignName: campaign.name }),
      },
      {
        agencyId: agency.id,
        userId: designer.id,
        action: 'CONTENT_SUBMITTED_FOR_APPROVAL',
        entityType: 'CONTENT_POST',
        entityId: post.id,
        metadata: JSON.stringify({ postTitle: post.title, clientName: client.name }),
      },
    ],
  });

  console.log('[Seed] Database successfully populated with realistic demonstration data!');
  console.log('[Seed] Credentials for testing:');
  console.log('       Agency Owner:  owner@apexdigital.com / Password123!');
  console.log('       Campaign Mgr:  manager@apexdigital.com / Password123!');
  console.log('       Designer:      designer@apexdigital.com / Password123!');
  console.log('       Client Portal: client@himalayancoffee.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
