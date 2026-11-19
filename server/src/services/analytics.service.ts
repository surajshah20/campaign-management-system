import { prisma } from '../db/prisma';

export class AnalyticsService {
  static async getOverviewAnalytics(
    agencyId: string,
    filters?: { campaignId?: string; platform?: string; days?: number }
  ) {
    const days = filters?.days || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const adWhere: any = { agencyId };
    if (filters?.campaignId && filters.campaignId !== 'ALL') {
      adWhere.campaignId = filters.campaignId;
    }
    if (filters?.platform && filters.platform !== 'ALL') {
      adWhere.platform = filters.platform;
    }

    const adCampaigns = await prisma.adCampaign.findMany({
      where: adWhere,
      include: {
        metrics: {
          where: {
            date: { gte: sinceDate },
          },
          orderBy: { date: 'asc' },
        },
        campaign: { select: { id: true, name: true, allocatedBudget: true } },
      },
    });

    // 1. Rollup totals
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalLeads = 0;
    let totalRevenue = 0;

    const platformBreakdown: Record<
      string,
      { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }
    > = {
      META_ADS: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      GOOGLE_ADS: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      TIKTOK_ADS: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      LINKEDIN_ADS: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    };

    // Date bucket aggregator for timeseries chart
    const dailyMap = new Map<
      string,
      { date: string; spend: number; impressions: number; reach: number; clicks: number; conversions: number; revenue: number }
    >();

    for (const adCamp of adCampaigns) {
      const p = adCamp.platform || 'OTHER';
      if (!platformBreakdown[p]) {
        platformBreakdown[p] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
      }

      for (const m of adCamp.metrics) {
        totalSpend += m.spend;
        totalImpressions += m.impressions;
        totalReach += m.reach;
        totalClicks += m.clicks;
        totalConversions += m.conversions;
        totalLeads += m.leads;
        totalRevenue += m.revenue;

        platformBreakdown[p].spend += m.spend;
        platformBreakdown[p].impressions += m.impressions;
        platformBreakdown[p].clicks += m.clicks;
        platformBreakdown[p].conversions += m.conversions;
        platformBreakdown[p].revenue += m.revenue;

        const dateKey = m.date.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || {
          date: dateKey,
          spend: 0,
          impressions: 0,
          reach: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        };

        existing.spend += m.spend;
        existing.impressions += m.impressions;
        existing.reach += m.reach;
        existing.clicks += m.clicks;
        existing.conversions += m.conversions;
        existing.revenue += m.revenue;
        dailyMap.set(dateKey, existing);
      }
    }

    const overallRoas = totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0;
    const overallCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const overallCpc = totalClicks > 0 ? parseFloat((totalSpend / totalClicks).toFixed(2)) : 0;
    const overallCpm = totalImpressions > 0 ? parseFloat(((totalSpend / totalImpressions) * 1000).toFixed(2)) : 0;
    const costPerConversion = totalConversions > 0 ? parseFloat((totalSpend / totalConversions).toFixed(2)) : 0;

    const timeseries = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const platformComparison = Object.entries(platformBreakdown).map(([platform, data]) => ({
      platform,
      ...data,
      roas: data.spend > 0 ? parseFloat((data.revenue / data.spend).toFixed(2)) : 0,
      ctr: data.impressions > 0 ? parseFloat(((data.clicks / data.impressions) * 100).toFixed(2)) : 0,
    }));

    return {
      summary: {
        totalSpend,
        totalImpressions,
        totalReach,
        totalClicks,
        totalConversions,
        totalLeads,
        totalRevenue,
        overallRoas,
        overallCtr,
        overallCpc,
        overallCpm,
        costPerConversion,
      },
      timeseries,
      platformComparison,
      campaignCount: adCampaigns.length,
    };
  }
}
