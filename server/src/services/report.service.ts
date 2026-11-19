import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface CreateReportInput {
  clientId: string;
  campaignId?: string;
  title: string;
  observations?: string;
  recommendations?: string;
  isPubliclyShared?: boolean;
}

export interface UpdateReportInput {
  title?: string;
  observations?: string;
  recommendations?: string;
  isPubliclyShared?: boolean;
}

export class ReportService {
  static async generateReport(agencyId: string, userId: string, input: CreateReportInput) {
    // 1. Verify Client belongs to agency
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, agencyId },
    });
    if (!client) {
      throw new AppError('Client not found in your agency workspace.', 404);
    }

    // 2. Verify Campaign if specified
    if (input.campaignId) {
      const camp = await prisma.campaign.findFirst({
        where: { id: input.campaignId, clientId: input.clientId, agencyId },
      });
      if (!camp) {
        throw new AppError('Specified marketing campaign not found for this client.', 404);
      }
    }

    // 3. Compute live metric snapshot to freeze in summaryJson
    const campaignFilter = input.campaignId ? { id: input.campaignId } : { clientId: input.clientId };

    const campaigns = await prisma.campaign.findMany({
      where: {
        agencyId,
        ...campaignFilter,
      },
      include: {
        adCampaigns: {
          include: {
            metrics: true,
          },
        },
        contentPosts: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledDate: true,
            publishedAt: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    let totalBudget = 0;
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    const channelStats: Record<string, { spend: number; impressions: number; clicks: number; revenue: number }> = {};

    let totalPostsCount = 0;
    let approvedPostsCount = 0;
    let publishedPostsCount = 0;

    let totalTasksCount = 0;
    let completedTasksCount = 0;

    for (const c of campaigns) {
      totalBudget += c.allocatedBudget;
      totalPostsCount += c.contentPosts.length;
      approvedPostsCount += c.contentPosts.filter((p) => p.status === 'APPROVED').length;
      publishedPostsCount += c.contentPosts.filter((p) => p.status === 'PUBLISHED').length;

      totalTasksCount += c.tasks.length;
      completedTasksCount += c.tasks.filter((t) => t.status === 'COMPLETED').length;

      for (const ad of c.adCampaigns) {
        totalSpend += ad.spendAmount;
        const p = ad.platform || 'OTHER';
        if (!channelStats[p]) {
          channelStats[p] = { spend: 0, impressions: 0, clicks: 0, revenue: 0 };
        }
        channelStats[p].spend += ad.spendAmount;

        for (const m of ad.metrics) {
          totalImpressions += m.impressions;
          totalReach += m.reach;
          totalClicks += m.clicks;
          totalConversions += m.conversions;
          totalRevenue += m.revenue;

          channelStats[p].impressions += m.impressions;
          channelStats[p].clicks += m.clicks;
          channelStats[p].revenue += m.revenue;
        }
      }
    }

    const roas = totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0;
    const ctr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const cpc = totalClicks > 0 ? parseFloat((totalSpend / totalClicks).toFixed(2)) : 0;

    const snapshotData = {
      generatedAt: new Date().toISOString(),
      clientName: client.name,
      campaignsIncluded: campaigns.map((c) => ({ id: c.id, name: c.name, budget: c.allocatedBudget })),
      financials: {
        totalBudget,
        totalSpend,
        totalRevenue,
        roas,
      },
      performance: {
        totalImpressions,
        totalReach,
        totalClicks,
        ctr,
        cpc,
        totalConversions,
      },
      deliverables: {
        totalPosts: totalPostsCount,
        approvedPosts: approvedPostsCount,
        publishedPosts: publishedPostsCount,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
      },
      channels: Object.entries(channelStats).map(([platform, data]) => ({
        platform,
        ...data,
        roas: data.spend > 0 ? parseFloat((data.revenue / data.spend).toFixed(2)) : 0,
      })),
    };

    const shareToken = crypto.randomBytes(24).toString('hex');

    const report = await prisma.report.create({
      data: {
        agencyId,
        clientId: input.clientId,
        campaignId: input.campaignId || null,
        title: input.title.trim(),
        shareToken,
        isPubliclyShared: input.isPubliclyShared ?? true,
        summaryJson: JSON.stringify(snapshotData),
        observations: input.observations?.trim() || null,
        recommendations: input.recommendations?.trim() || null,
      },
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: report.id,
        metadata: JSON.stringify({
          reportTitle: report.title,
          clientName: client.name,
          shareToken,
        }),
      },
    });

    return report;
  }

  static async listReports(
    agencyId: string,
    filters?: { clientId?: string; campaignId?: string }
  ) {
    const where: any = { agencyId };
    if (filters?.clientId && filters.clientId !== 'ALL') {
      where.clientId = filters.clientId;
    }
    if (filters?.campaignId && filters.campaignId !== 'ALL') {
      where.campaignId = filters.campaignId;
    }

    return prisma.report.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getReportById(agencyId: string, reportId: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, agencyId },
      include: {
        client: { select: { id: true, name: true, logoUrl: true, industry: true } },
        campaign: { select: { id: true, name: true } },
        agency: { select: { id: true, name: true, logoUrl: true, currency: true } },
      },
    });

    if (!report) {
      throw new AppError('Client report not found in this workspace.', 404);
    }

    return report;
  }

  static async updateReport(
    agencyId: string,
    userId: string,
    reportId: string,
    input: UpdateReportInput
  ) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, agencyId },
    });
    if (!report) {
      throw new AppError('Report not found in this workspace.', 404);
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.observations !== undefined && { observations: input.observations.trim() || null }),
        ...(input.recommendations !== undefined && { recommendations: input.recommendations.trim() || null }),
        ...(input.isPubliclyShared !== undefined && { isPubliclyShared: input.isPubliclyShared }),
      },
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'REPORT_UPDATED',
        entityType: 'REPORT',
        entityId: reportId,
        metadata: JSON.stringify({ title: updated.title, isPubliclyShared: updated.isPubliclyShared }),
      },
    });

    return updated;
  }

  static async deleteReport(agencyId: string, userId: string, reportId: string) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, agencyId },
    });
    if (!report) {
      throw new AppError('Report not found in this workspace.', 404);
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'REPORT_DELETED',
        entityType: 'REPORT',
        entityId: reportId,
        metadata: JSON.stringify({ title: report.title }),
      },
    });

    return { success: true };
  }

  static async getPublicReport(shareToken: string) {
    const report = await prisma.report.findUnique({
      where: { shareToken },
      include: {
        client: { select: { id: true, name: true, logoUrl: true, industry: true } },
        campaign: { select: { id: true, name: true } },
        agency: { select: { id: true, name: true, logoUrl: true, currency: true } },
      },
    });

    if (!report || !report.isPubliclyShared) {
      throw new AppError('This presentation is either private or does not exist.', 404);
    }

    return {
      id: report.id,
      title: report.title,
      createdAt: report.createdAt,
      observations: report.observations,
      recommendations: report.recommendations,
      summary: report.summaryJson ? JSON.parse(report.summaryJson) : null,
      client: report.client,
      campaign: report.campaign,
      agency: report.agency,
    };
  }
}
