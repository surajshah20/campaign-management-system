import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface CreateCampaignInput {
  clientId: string;
  name: string;
  description?: string;
  objective?: string;
  campaignType?: string;
  status?: string;
  allocatedBudget?: number;
  targetAudience?: string;
  platforms?: string[];
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  clientId?: string;
  description?: string;
  objective?: string;
  campaignType?: string;
  status?: string;
  allocatedBudget?: number;
  targetAudience?: string;
  platforms?: string[];
  startDate?: string;
  endDate?: string;
}

export class CampaignService {
  static async listCampaigns(
    agencyId: string,
    filters?: { clientId?: string; status?: string; search?: string }
  ) {
    const where: any = { agencyId };

    if (filters?.clientId && filters.clientId !== 'ALL') {
      where.clientId = filters.clientId;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { objective: { contains: filters.search } },
      ];
    }

    return prisma.campaign.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
        _count: {
          select: {
            tasks: true,
            contentPosts: true,
            adCampaigns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCampaignById(agencyId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, agencyId },
      include: {
        client: true,
        tasks: {
          include: {
            assignee: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
        contentPosts: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
          orderBy: { scheduledDate: 'asc' },
        },
        budgets: {
          include: {
            expenses: { orderBy: { date: 'desc' } },
          },
        },
        _count: {
          select: {
            tasks: true,
            contentPosts: true,
            adCampaigns: true,
            reports: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign not found or you lack permission.', 404);
    }

    return campaign;
  }

  static async createCampaign(
    agencyId: string,
    userId: string,
    input: CreateCampaignInput
  ) {
    // Verify client belongs to this agency
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, agencyId },
    });

    if (!client) {
      throw new AppError('Specified client was not found in your agency workspace.', 404);
    }

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          agencyId,
          clientId: input.clientId,
          name: input.name.trim(),
          description: input.description?.trim(),
          objective: input.objective?.trim(),
          campaignType: input.campaignType || 'SOCIAL_MEDIA_MARKETING',
          status: input.status || 'PLANNING',
          allocatedBudget: input.allocatedBudget || 0,
          targetAudience: input.targetAudience?.trim(),
          platformsJson: input.platforms ? JSON.stringify(input.platforms) : '[]',
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        },
        include: {
          client: { select: { id: true, name: true } },
        },
      });

      // Automatically initialize budget record for campaign
      if (input.allocatedBudget && input.allocatedBudget > 0) {
        await tx.budget.create({
          data: {
            agencyId,
            campaignId: created.id,
            allocatedAmount: input.allocatedBudget,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CAMPAIGN_CREATED',
          entityType: 'CAMPAIGN',
          entityId: created.id,
          metadata: JSON.stringify({
            campaignName: created.name,
            clientName: client.name,
          }),
        },
      });

      return created;
    });

    return campaign;
  }

  static async updateCampaign(
    agencyId: string,
    campaignId: string,
    userId: string,
    input: UpdateCampaignInput
  ) {
    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId, agencyId },
    });

    if (!existing) {
      throw new AppError('Campaign not found or you lack permission.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const camp = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          name: input.name?.trim(),
          clientId: input.clientId,
          description: input.description?.trim(),
          objective: input.objective?.trim(),
          campaignType: input.campaignType,
          status: input.status,
          allocatedBudget: input.allocatedBudget,
          targetAudience: input.targetAudience?.trim(),
          platformsJson: input.platforms ? JSON.stringify(input.platforms) : undefined,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CAMPAIGN_UPDATED',
          entityType: 'CAMPAIGN',
          entityId: campaignId,
          metadata: JSON.stringify({ campaignName: camp.name, status: camp.status }),
        },
      });

      return camp;
    });

    return updated;
  }

  static async deleteCampaign(agencyId: string, campaignId: string, userId: string) {
    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId, agencyId },
    });

    if (!existing) {
      throw new AppError('Campaign not found or you lack permission.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.campaign.delete({ where: { id: campaignId } });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CAMPAIGN_DELETED',
          entityType: 'CAMPAIGN',
          entityId: campaignId,
          metadata: JSON.stringify({ campaignName: existing.name }),
        },
      });
    });

    return { success: true };
  }
}
