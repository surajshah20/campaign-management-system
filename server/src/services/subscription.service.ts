import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface PlanDefinition {
  id: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  name: string;
  tagline: string;
  monthlyPriceNpr: number;
  annualPriceNpr: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  limits: {
    maxClients: number; // -1 indicates unlimited
    maxTeamMembers: number;
    maxCampaigns: number;
    storageGb: number;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
  features: string[];
}

export const SAAS_PLANS: Record<string, PlanDefinition> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'Ideal for freelance digital marketers & boutique studios.',
    monthlyPriceNpr: 6500,
    annualPriceNpr: 62400, // NPR 5,200/mo billed annually
    monthlyPriceUsd: 49,
    annualPriceUsd: 468,
    limits: {
      maxClients: 3,
      maxTeamMembers: 5,
      maxCampaigns: 5,
      storageGb: 5,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    },
    features: [
      'Up to 3 Active Client Workspaces',
      '5 Team Member Seats',
      '5 Marketing Campaigns',
      '5 GB Secure Cloud Asset Storage',
      'Client Approval Portal (Brand Review)',
      'Community & Standard Email Support',
    ],
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    tagline: 'The sweet spot for scaling digital marketing agencies.',
    monthlyPriceNpr: 19500,
    annualPriceNpr: 187200, // NPR 15,600/mo billed annually
    monthlyPriceUsd: 149,
    annualPriceUsd: 1428,
    limits: {
      maxClients: 15,
      maxTeamMembers: 20,
      maxCampaigns: 30,
      storageGb: 50,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    },
    features: [
      'Up to 15 Active Client Workspaces',
      '20 Team Member Seats',
      '30 Multi-Platform Campaigns',
      '50 GB Cloud Media Storage',
      'Paid Ad Performance Tracking (Meta & Google)',
      'Automated Executive Client PDF Reports',
      'Custom Agency Branding & Logo',
      'Priority Support SLA',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise / Scale',
    tagline: 'For full-service agencies requiring unlimited bandwidth & custom SLA.',
    monthlyPriceNpr: 39500,
    annualPriceNpr: 379200, // NPR 31,600/mo billed annually
    monthlyPriceUsd: 299,
    annualPriceUsd: 2868,
    limits: {
      maxClients: -1, // Unlimited
      maxTeamMembers: -1,
      maxCampaigns: -1,
      storageGb: 500,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    },
    features: [
      'Unlimited Active Client Workspaces',
      'Unlimited Team Seats & RBAC Personas',
      'Unlimited Campaigns & Task Boards',
      '500 GB High-Speed CDN Asset Storage',
      'Direct Meta, Google & TikTok API Connectors',
      'Multi-Currency Financial Consolidated Reports',
      'Dedicated Account Director & Custom SLA',
      'Custom Domain White-Labeling',
    ],
  },
};

export class SubscriptionService {
  static getPlans() {
    return Object.values(SAAS_PLANS);
  }

  static async getOrCreateSubscription(agencyId: string) {
    let sub = await prisma.subscription.findUnique({
      where: { agencyId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!sub) {
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + 30);

      const trialEnd = new Date();
      trialEnd.setDate(now.getDate() + 14);

      sub = await prisma.subscription.create({
        data: {
          agencyId,
          plan: 'GROWTH',
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: end,
          trialEndsAt: trialEnd,
          paymentMethodBrand: 'Visa',
          paymentMethodLast4: '4242',
          paymentMethodExp: '12/28',
        },
        include: {
          invoices: true,
        },
      });

      // Create initial activation invoice
      await prisma.billingInvoice.create({
        data: {
          agencyId,
          subscriptionId: sub.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: SAAS_PLANS.GROWTH.monthlyPriceNpr,
          currency: 'NPR',
          status: 'PAID',
          billingReason: 'SUBSCRIPTION_CYCLE',
          paidAt: now,
        },
      });
    }

    // Measure live usage
    const [clientCount, memberCount, campaignCount, storageAgg] = await Promise.all([
      prisma.client.count({ where: { agencyId } }),
      prisma.agencyMember.count({ where: { agencyId } }),
      prisma.campaign.count({ where: { agencyId } }),
      prisma.storageFile.aggregate({
        where: { agencyId },
        _sum: { fileSize: true },
      }),
    ]);

    const planDef = SAAS_PLANS[sub.plan] || SAAS_PLANS.GROWTH;
    const totalStorageBytes = storageAgg._sum.fileSize || 0;
    const totalStorageGb = parseFloat((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2));

    const usage = {
      clients: {
        current: clientCount,
        max: planDef.limits.maxClients,
        percentage:
          planDef.limits.maxClients === -1
            ? 0
            : Math.min(Math.round((clientCount / planDef.limits.maxClients) * 100), 100),
      },
      teamMembers: {
        current: memberCount,
        max: planDef.limits.maxTeamMembers,
        percentage:
          planDef.limits.maxTeamMembers === -1
            ? 0
            : Math.min(Math.round((memberCount / planDef.limits.maxTeamMembers) * 100), 100),
      },
      campaigns: {
        current: campaignCount,
        max: planDef.limits.maxCampaigns,
        percentage:
          planDef.limits.maxCampaigns === -1
            ? 0
            : Math.min(Math.round((campaignCount / planDef.limits.maxCampaigns) * 100), 100),
      },
      storage: {
        currentGb: totalStorageGb,
        maxGb: planDef.limits.storageGb,
        percentage: Math.min(
          Math.round((totalStorageGb / planDef.limits.storageGb) * 100),
          100
        ),
      },
    };

    return {
      subscription: sub,
      plan: planDef,
      usage,
    };
  }

  static async changePlan(
    agencyId: string,
    userId: string,
    input: { plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE'; billingCycle?: 'MONTHLY' | 'ANNUAL' }
  ) {
    const targetPlan = SAAS_PLANS[input.plan];
    if (!targetPlan) {
      throw new AppError(`Invalid subscription plan: ${input.plan}`, 400);
    }

    // 1. Quota Validation on Downgrade
    const [clientCount, memberCount] = await Promise.all([
      prisma.client.count({ where: { agencyId } }),
      prisma.agencyMember.count({ where: { agencyId } }),
    ]);

    if (targetPlan.limits.maxClients !== -1 && clientCount > targetPlan.limits.maxClients) {
      throw new AppError(
        `Cannot switch to ${targetPlan.name} plan. You currently have ${clientCount} active clients, but ${targetPlan.name} allows a maximum of ${targetPlan.limits.maxClients}. Please archive inactive clients first.`,
        400
      );
    }

    if (targetPlan.limits.maxTeamMembers !== -1 && memberCount > targetPlan.limits.maxTeamMembers) {
      throw new AppError(
        `Cannot switch to ${targetPlan.name} plan. You currently have ${memberCount} team members, but ${targetPlan.name} allows a maximum of ${targetPlan.limits.maxTeamMembers}. Please remove surplus members first.`,
        400
      );
    }

    const currentSub = await this.getOrCreateSubscription(agencyId);
    const billingCycle = input.billingCycle || currentSub.subscription.billingCycle;

    const price =
      billingCycle === 'ANNUAL' ? targetPlan.annualPriceNpr : targetPlan.monthlyPriceNpr;

    const now = new Date();
    const periodEnd = new Date();
    if (billingCycle === 'ANNUAL') {
      periodEnd.setFullYear(now.getFullYear() + 1);
    } else {
      periodEnd.setMonth(now.getMonth() + 1);
    }

    const updatedSub = await prisma.subscription.update({
      where: { agencyId },
      data: {
        plan: input.plan,
        billingCycle,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Generate Invoice for the change
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await prisma.billingInvoice.create({
      data: {
        agencyId,
        subscriptionId: updatedSub.id,
        invoiceNumber,
        amount: price,
        currency: 'NPR',
        status: 'PAID',
        billingReason: 'PLAN_UPGRADE',
        paidAt: now,
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'SUBSCRIPTION_PLAN_CHANGED',
        entityType: 'SUBSCRIPTION',
        entityId: updatedSub.id,
        metadata: JSON.stringify({
          previousPlan: currentSub.subscription.plan,
          newPlan: input.plan,
          billingCycle,
          invoiceNumber,
        }),
      },
    });

    return { subscription: updatedSub, invoice };
  }

  static async updatePaymentMethod(
    agencyId: string,
    userId: string,
    input: { brand: string; last4: string; expMonth: string; expYear: string }
  ) {
    const updated = await prisma.subscription.update({
      where: { agencyId },
      data: {
        paymentMethodBrand: input.brand,
        paymentMethodLast4: input.last4,
        paymentMethodExp: `${input.expMonth}/${input.expYear}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'PAYMENT_METHOD_UPDATED',
        entityType: 'SUBSCRIPTION',
        entityId: updated.id,
        metadata: JSON.stringify({
          brand: input.brand,
          last4: input.last4,
        }),
      },
    });

    return updated;
  }

  static async cancelSubscription(agencyId: string, userId: string) {
    const updated = await prisma.subscription.update({
      where: { agencyId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'SUBSCRIPTION_CANCELED',
        entityType: 'SUBSCRIPTION',
        entityId: updated.id,
        metadata: JSON.stringify({
          cancelAtPeriodEnd: true,
          accessUntil: updated.currentPeriodEnd,
        }),
      },
    });

    return updated;
  }

  static async resumeSubscription(agencyId: string, userId: string) {
    const updated = await prisma.subscription.update({
      where: { agencyId },
      data: {
        cancelAtPeriodEnd: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'SUBSCRIPTION_RESUMED',
        entityType: 'SUBSCRIPTION',
        entityId: updated.id,
        metadata: JSON.stringify({
          cancelAtPeriodEnd: false,
        }),
      },
    });

    return updated;
  }

  static async listInvoices(agencyId: string) {
    return prisma.billingInvoice.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async checkQuota(
    agencyId: string,
    resource: 'CLIENT' | 'TEAM_MEMBER' | 'CAMPAIGN'
  ) {
    const subInfo = await this.getOrCreateSubscription(agencyId);
    const { limits } = subInfo.plan;

    if (resource === 'CLIENT') {
      const count = await prisma.client.count({ where: { agencyId } });
      const allowed = limits.maxClients === -1 || count < limits.maxClients;
      return { allowed, current: count, max: limits.maxClients, plan: subInfo.plan.name };
    }

    if (resource === 'TEAM_MEMBER') {
      const count = await prisma.agencyMember.count({ where: { agencyId } });
      const allowed = limits.maxTeamMembers === -1 || count < limits.maxTeamMembers;
      return { allowed, current: count, max: limits.maxTeamMembers, plan: subInfo.plan.name };
    }

    if (resource === 'CAMPAIGN') {
      const count = await prisma.campaign.count({ where: { agencyId } });
      const allowed = limits.maxCampaigns === -1 || count < limits.maxCampaigns;
      return { allowed, current: count, max: limits.maxCampaigns, plan: subInfo.plan.name };
    }

    return { allowed: true, current: 0, max: -1, plan: subInfo.plan.name };
  }
}
