import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface CreateAdAccountInput {
  platform: string;
  accountName: string;
  externalId?: string;
  currency?: string;
}

export interface CreateAdCampaignInput {
  campaignId: string;
  adAccountId?: string;
  name: string;
  platform: string;
  budgetAmount?: number;
  spendAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface LogMetricInput {
  adCampaignId: string;
  date: string;
  impressions?: number;
  reach?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  leads?: number;
  revenue?: number;
}

export class AdvertisingService {
  static async listAccounts(agencyId: string) {
    return prisma.adAccount.findMany({
      where: { agencyId },
      include: {
        _count: { select: { campaigns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createAccount(agencyId: string, input: CreateAdAccountInput) {
    return prisma.adAccount.create({
      data: {
        agencyId,
        platform: input.platform,
        accountName: input.accountName.trim(),
        externalId: input.externalId?.trim() || null,
        currency: input.currency || 'NPR',
      },
    });
  }

  static async listAdCampaigns(
    agencyId: string,
    filters?: { platform?: string; campaignId?: string }
  ) {
    const where: any = { agencyId };
    if (filters?.platform && filters.platform !== 'ALL') {
      where.platform = filters.platform;
    }
    if (filters?.campaignId && filters.campaignId !== 'ALL') {
      where.campaignId = filters.campaignId;
    }

    return prisma.adCampaign.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        adAccount: { select: { id: true, accountName: true, platform: true } },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createAdCampaign(
    agencyId: string,
    userId: string,
    input: CreateAdCampaignInput
  ) {
    // Verify campaign belongs to agency
    const camp = await prisma.campaign.findFirst({
      where: { id: input.campaignId, agencyId },
    });
    if (!camp) {
      throw new AppError('Marketing campaign not found in your agency.', 404);
    }

    return prisma.$transaction(async (tx) => {
      const adCamp = await tx.adCampaign.create({
        data: {
          agencyId,
          campaignId: input.campaignId,
          adAccountId: input.adAccountId || null,
          name: input.name.trim(),
          platform: input.platform,
          budgetAmount: input.budgetAmount || 0,
          spendAmount: input.spendAmount || 0,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'AD_CAMPAIGN_CREATED',
          entityType: 'AD_CAMPAIGN',
          entityId: adCamp.id,
          metadata: JSON.stringify({ name: adCamp.name, platform: adCamp.platform }),
        },
      });

      return adCamp;
    });
  }

  static async logMetric(agencyId: string, userId: string, input: LogMetricInput) {
    const adCamp = await prisma.adCampaign.findFirst({
      where: { id: input.adCampaignId, agencyId },
    });
    if (!adCamp) {
      throw new AppError('Ad campaign not found.', 404);
    }

    const spend = input.spend || 0;
    const revenue = input.revenue || 0;
    const roas = spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : 0;
    const metricDate = new Date(input.date);

    return prisma.$transaction(async (tx) => {
      const metric = await tx.adMetric.create({
        data: {
          adCampaignId: input.adCampaignId,
          date: metricDate,
          impressions: input.impressions || 0,
          reach: input.reach || 0,
          clicks: input.clicks || 0,
          spend,
          conversions: input.conversions || 0,
          leads: input.leads || 0,
          revenue,
          roas,
        },
      });

      // Update total spend on adCampaign
      await tx.adCampaign.update({
        where: { id: input.adCampaignId },
        data: {
          spendAmount: { increment: spend },
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'AD_METRIC_LOGGED',
          entityType: 'AD_METRIC',
          entityId: metric.id,
          metadata: JSON.stringify({
            campaignName: adCamp.name,
            spend,
            conversions: input.conversions,
            roas,
          }),
        },
      });

      return metric;
    });
  }

  static async ingestCsvMetrics(
    agencyId: string,
    userId: string,
    adCampaignId: string,
    csvRows: string
  ) {
    const adCamp = await prisma.adCampaign.findFirst({
      where: { id: adCampaignId, agencyId },
    });
    if (!adCamp) {
      throw new AppError('Ad campaign not found in your agency workspace.', 404);
    }

    const lines = csvRows.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new AppError('CSV must include a header and at least one data row.', 400);
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dateIdx = headers.indexOf('date');
    const impIdx = headers.indexOf('impressions');
    const reachIdx = headers.indexOf('reach');
    const clicksIdx = headers.indexOf('clicks');
    const spendIdx = headers.indexOf('spend');
    const convIdx = headers.indexOf('conversions');
    const revIdx = headers.indexOf('revenue');

    if (dateIdx === -1 || spendIdx === -1) {
      throw new AppError('CSV must contain at least "date" and "spend" columns.', 400);
    }

    let recordsCreated = 0;
    let totalSpendAdded = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < headers.length) continue;

      const date = new Date(parts[dateIdx]);
      if (isNaN(date.getTime())) continue;

      const impressions = impIdx !== -1 ? parseInt(parts[impIdx], 10) || 0 : 0;
      const reach = reachIdx !== -1 ? parseInt(parts[reachIdx], 10) || 0 : 0;
      const clicks = clicksIdx !== -1 ? parseInt(parts[clicksIdx], 10) || 0 : 0;
      const spend = parseFloat(parts[spendIdx]) || 0;
      const conversions = convIdx !== -1 ? parseInt(parts[convIdx], 10) || 0 : 0;
      const revenue = revIdx !== -1 ? parseFloat(parts[revIdx]) || 0 : 0;
      const roas = spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : 0;

      await prisma.adMetric.create({
        data: {
          adCampaignId,
          date,
          impressions,
          reach,
          clicks,
          spend,
          conversions,
          revenue,
          roas,
        },
      });

      recordsCreated++;
      totalSpendAdded += spend;
    }

    if (totalSpendAdded > 0) {
      await prisma.adCampaign.update({
        where: { id: adCampaignId },
        data: { spendAmount: { increment: totalSpendAdded } },
      });
    }

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'CSV_METRICS_INGESTED',
        entityType: 'AD_CAMPAIGN',
        entityId: adCampaignId,
        metadata: JSON.stringify({
          recordsCreated,
          totalSpendAdded,
          adCampaignName: adCamp.name,
        }),
      },
    });

    return { recordsCreated, totalSpendAdded };
  }
}
