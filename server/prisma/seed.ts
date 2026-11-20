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

  // 9. Paid Advertising Setup & Metrics
  const metaAccount = await prisma.adAccount.create({
    data: {
      agencyId: agency.id,
      platform: 'META_ADS',
      accountName: 'Apex Meta Ads Portfolio',
      externalId: 'act_8271049281',
      currency: 'NPR',
    },
  });

  const googleAccount = await prisma.adAccount.create({
    data: {
      agencyId: agency.id,
      platform: 'GOOGLE_ADS',
      accountName: 'Apex Google Ads Portfolio',
      externalId: '982-124-9012',
      currency: 'NPR',
    },
  });

  const metaAdCampaign = await prisma.adCampaign.create({
    data: {
      agencyId: agency.id,
      campaignId: campaign.id,
      adAccountId: metaAccount.id,
      name: 'Cold Brew Instagram Reels & Stories Awareness',
      platform: 'META_ADS',
      budgetAmount: 80000,
      spendAmount: 76000,
      status: 'ACTIVE',
    },
  });

  const googleAdCampaign = await prisma.adCampaign.create({
    data: {
      agencyId: agency.id,
      campaignId: campaign.id,
      adAccountId: googleAccount.id,
      name: 'Cold Brew Specialty Search & PMax',
      platform: 'GOOGLE_ADS',
      budgetAmount: 60000,
      spendAmount: 58000,
      status: 'ACTIVE',
    },
  });

  // Seed daily metrics for the past 14 days
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const metricDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Meta metrics
    const metaSpend = Math.round(5000 + Math.random() * 800);
    const metaRev = Math.round(metaSpend * (2.8 + Math.random() * 0.8));
    await prisma.adMetric.create({
      data: {
        adCampaignId: metaAdCampaign.id,
        date: metricDate,
        impressions: Math.round(11000 + Math.random() * 2500),
        reach: Math.round(8500 + Math.random() * 1800),
        clicks: Math.round(480 + Math.random() * 120),
        spend: metaSpend,
        conversions: Math.round(18 + Math.random() * 8),
        leads: Math.round(12 + Math.random() * 6),
        revenue: metaRev,
        roas: parseFloat((metaRev / metaSpend).toFixed(2)),
      },
    });

    // Google metrics
    const googleSpend = Math.round(3800 + Math.random() * 600);
    const googleRev = Math.round(googleSpend * (3.4 + Math.random() * 0.9));
    await prisma.adMetric.create({
      data: {
        adCampaignId: googleAdCampaign.id,
        date: metricDate,
        impressions: Math.round(8500 + Math.random() * 2000),
        reach: Math.round(6200 + Math.random() * 1200),
        clicks: Math.round(560 + Math.random() * 140),
        spend: googleSpend,
        conversions: Math.round(22 + Math.random() * 9),
        leads: Math.round(15 + Math.random() * 7),
        revenue: googleRev,
        roas: parseFloat((googleRev / googleSpend).toFixed(2)),
      },
    });
  }

  // 10. Reports (Phase 6)
  const reportSnapshot = {
    generatedAt: new Date().toISOString(),
    clientName: client.name,
    campaignsIncluded: [{ id: campaign.id, name: campaign.name, budget: campaign.allocatedBudget }],
    financials: {
      totalBudget: 250000,
      totalSpend: 140000,
      totalRevenue: 595000,
      roas: 4.25,
    },
    performance: {
      totalImpressions: 486000,
      totalReach: 395000,
      totalClicks: 17400,
      ctr: 3.58,
      cpc: 8.05,
      totalConversions: 940,
    },
    deliverables: {
      totalPosts: 8,
      approvedPosts: 6,
      publishedPosts: 4,
      totalTasks: 6,
      completedTasks: 4,
    },
    channels: [
      { platform: 'META_ADS', spend: 80000, impressions: 320000, clicks: 12500, revenue: 352000, roas: 4.4 },
      { platform: 'GOOGLE_ADS', spend: 60000, impressions: 166000, clicks: 4900, revenue: 243000, roas: 4.05 },
    ],
  };

  await prisma.report.create({
    data: {
      agencyId: agency.id,
      clientId: client.id,
      campaignId: campaign.id,
      title: 'Q4 Omnichannel Growth & Festive Campaign Performance Wrap-Up',
      shareToken: 'himalayan-q4-executive-wrapup',
      isPubliclyShared: true,
      summaryJson: JSON.stringify(reportSnapshot),
      observations:
        'Video creative assets outperformed static imagery by 3.2x in CTR. Meta Ads drove high-volume awareness and top-of-funnel customer discovery, while Google Performance Max captured high-intent coffee bean subscription searches with a 4.05x blended ROAS.',
      recommendations:
        '1. Reallocate 20% of Q1 budget toward short-form TikTok & Instagram Reels showcasing single-origin brewing guides.\n2. Scale Google PMax budget ahead of the holiday gifting season.\n3. Implement a dedicated landing page for subscription signups to reduce CAC further.',
    },
  });

  // 11. Third-Party Integrations (Phase 7)
  const metaIntegration = await prisma.integration.create({
    data: {
      agencyId: agency.id,
      provider: 'META_ADS',
      name: 'Apex Meta Marketing API Connector',
      status: 'CONNECTED',
      configJson: JSON.stringify({
        appId: '1092837465928',
        accessToken: 'EAA...x99',
        adAccountId: 'act_102938475',
      }),
      lastSyncAt: new Date(),
      syncStatus: 'SUCCESS',
    },
  });

  await prisma.integration.create({
    data: {
      agencyId: agency.id,
      provider: 'GOOGLE_ADS',
      name: 'Apex Google Ads API Connector',
      status: 'CONNECTED',
      configJson: JSON.stringify({
        customerId: '982-123-4567',
        developerToken: 'dev...382',
      }),
      lastSyncAt: new Date(Date.now() - 3600000),
      syncStatus: 'SUCCESS',
    },
  });

  await prisma.syncLog.createMany({
    data: [
      {
        integrationId: metaIntegration.id,
        agencyId: agency.id,
        status: 'SUCCESS',
        recordsProcessed: 2,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3590000),
      },
      {
        integrationId: metaIntegration.id,
        agencyId: agency.id,
        status: 'SUCCESS',
        recordsProcessed: 2,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    ],
  });

  // 12. SaaS Subscription & Billing (Phase 8)
  const subNow = new Date();
  const subPeriodEnd = new Date();
  subPeriodEnd.setDate(subNow.getDate() + 28);

  const agencySub = await prisma.subscription.create({
    data: {
      agencyId: agency.id,
      plan: 'GROWTH',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart: new Date(subNow.getTime() - 2 * 24 * 3600 * 1000),
      currentPeriodEnd: subPeriodEnd,
      cancelAtPeriodEnd: false,
      paymentMethodBrand: 'Mastercard',
      paymentMethodLast4: '5566',
      paymentMethodExp: '08/29',
    },
  });

  await prisma.billingInvoice.createMany({
    data: [
      {
        agencyId: agency.id,
        subscriptionId: agencySub.id,
        invoiceNumber: 'INV-2026-1082',
        amount: 19500,
        currency: 'NPR',
        status: 'PAID',
        billingReason: 'SUBSCRIPTION_CYCLE',
        paidAt: new Date(subNow.getTime() - 60 * 24 * 3600 * 1000),
        createdAt: new Date(subNow.getTime() - 60 * 24 * 3600 * 1000),
      },
      {
        agencyId: agency.id,
        subscriptionId: agencySub.id,
        invoiceNumber: 'INV-2026-1144',
        amount: 19500,
        currency: 'NPR',
        status: 'PAID',
        billingReason: 'SUBSCRIPTION_CYCLE',
        paidAt: new Date(subNow.getTime() - 30 * 24 * 3600 * 1000),
        createdAt: new Date(subNow.getTime() - 30 * 24 * 3600 * 1000),
      },
      {
        agencyId: agency.id,
        subscriptionId: agencySub.id,
        invoiceNumber: 'INV-2026-1219',
        amount: 19500,
        currency: 'NPR',
        status: 'PAID',
        billingReason: 'SUBSCRIPTION_CYCLE',
        paidAt: new Date(subNow.getTime() - 2 * 24 * 3600 * 1000),
        createdAt: new Date(subNow.getTime() - 2 * 24 * 3600 * 1000),
      },
    ],
  });

  // 13. Activity Log
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
