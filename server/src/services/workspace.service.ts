import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';
import { AgencyRole } from '../constants/roles';

export interface CreateWorkspaceInput {
  name: string;
  currency?: string;
  timezone?: string;
}

export class WorkspaceService {
  static async listUserWorkspaces(userId: string) {
    const memberships = await prisma.agencyMember.findMany({
      where: { userId },
      include: {
        agency: {
          include: {
            _count: {
              select: {
                members: true,
                clients: true,
                campaigns: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.agency.id,
      name: m.agency.name,
      slug: m.agency.slug,
      logoUrl: m.agency.logoUrl,
      currency: m.agency.currency,
      timezone: m.agency.timezone,
      role: m.role,
      memberCount: m.agency._count.members,
      clientCount: m.agency._count.clients,
      campaignCount: m.agency._count.campaigns,
      joinedAt: m.createdAt,
    }));
  }

  static async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    let baseSlug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'workspace';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.agency.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const agency = await prisma.$transaction(async (tx) => {
      const created = await tx.agency.create({
        data: {
          name: input.name.trim(),
          slug: uniqueSlug,
          currency: input.currency || 'NPR',
          timezone: input.timezone || 'Asia/Kathmandu',
        },
      });

      await tx.agencyMember.create({
        data: {
          agencyId: created.id,
          userId,
          role: AgencyRole.AGENCY_OWNER,
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId: created.id,
          userId,
          action: 'WORKSPACE_CREATED',
          entityType: 'AGENCY',
          entityId: created.id,
          metadata: JSON.stringify({ name: created.name }),
        },
      });

      return created;
    });

    return agency;
  }

  static async getWorkspaceDetails(agencyId: string, userId: string) {
    const membership = await prisma.agencyMember.findUnique({
      where: {
        agencyId_userId: {
          agencyId,
          userId,
        },
      },
      include: {
        agency: {
          include: {
            _count: {
              select: {
                members: true,
                clients: true,
                campaigns: true,
                tasks: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new AppError('Workspace not found or you are not a member.', 404);
    }

    return {
      id: membership.agency.id,
      name: membership.agency.name,
      slug: membership.agency.slug,
      logoUrl: membership.agency.logoUrl,
      currency: membership.agency.currency,
      timezone: membership.agency.timezone,
      role: membership.role,
      counts: membership.agency._count,
      createdAt: membership.agency.createdAt,
    };
  }

  static async getWorkspaceOverview(agencyId: string) {
    // 1. Client counts
    const totalClients = await prisma.client.count({ where: { agencyId } });
    const activeClients = await prisma.client.count({
      where: { agencyId, status: 'ACTIVE' },
    });

    // 2. Campaign counts
    const totalCampaigns = await prisma.campaign.count({ where: { agencyId } });
    const activeCampaigns = await prisma.campaign.count({
      where: { agencyId, status: 'ACTIVE' },
    });
    const completedCampaigns = await prisma.campaign.count({
      where: { agencyId, status: 'COMPLETED' },
    });

    // 3. Task counts & Due Dates
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: { agencyId },
      select: { id: true, status: true, dueDate: true },
    });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
    ).length;

    // 4. Pending Approvals
    const pendingApprovalsCount = await prisma.approval.count({
      where: {
        status: 'PENDING',
        version: {
          contentPost: {
            agencyId,
          },
        },
      },
    });

    // 5. Budgets & Financial aggregates
    const budgets = await prisma.budget.findMany({
      where: { agencyId },
      select: {
        allocatedAmount: true,
        advertisingSpend: true,
        productionCost: true,
        otherExpenses: true,
      },
    });
    const totalAllocatedBudget = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
    const totalAdSpend = budgets.reduce((acc, b) => acc + b.advertisingSpend, 0);
    const totalProductionCost = budgets.reduce((acc, b) => acc + b.productionCost, 0);
    const remainingBudget =
      totalAllocatedBudget - (totalAdSpend + totalProductionCost);

    // 6. Recent Campaigns list
    const recentCampaigns = await prisma.campaign.findMany({
      where: { agencyId },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { tasks: true, contentPosts: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 7. Recent Activity logs
    const recentActivities = await prisma.activityLog.findMany({
      where: { agencyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });

    // 8. Pending Approval Items Queue
    const approvalQueue = await prisma.approval.findMany({
      where: {
        version: {
          contentPost: { agencyId },
        },
      },
      include: {
        version: {
          include: {
            contentPost: {
              include: { client: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      metrics: {
        totalClients,
        activeClients,
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        pendingApprovalsCount,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalAllocatedBudget,
        totalAdSpend,
        totalProductionCost,
        remainingBudget,
      },
      recentCampaigns,
      recentActivities,
      approvalQueue,
    };
  }
}
