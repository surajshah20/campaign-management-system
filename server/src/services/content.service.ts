import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface CreatePostInput {
  clientId: string;
  campaignId?: string;
  title: string;
  caption?: string;
  platform?: string;
  status?: string;
  scheduledDate?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface CreateVersionInput {
  mediaUrl?: string;
  mediaType?: string;
  captionCopy?: string;
}

export interface ReviewApprovalInput {
  status: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  feedbackText?: string;
}

export class ContentService {
  static async listPosts(
    agencyId: string,
    filters?: {
      clientId?: string;
      campaignId?: string;
      platform?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: any = { agencyId };

    if (filters?.clientId && filters.clientId !== 'ALL') {
      where.clientId = filters.clientId;
    }
    if (filters?.campaignId && filters.campaignId !== 'ALL') {
      where.campaignId = filters.campaignId;
    }
    if (filters?.platform && filters.platform !== 'ALL') {
      where.platform = filters.platform;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.startDate && filters?.endDate) {
      where.scheduledDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return prisma.contentPost.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        campaign: { select: { id: true, name: true } },
        creator: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            approvals: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  static async getPostById(agencyId: string, postId: string) {
    const post = await prisma.contentPost.findFirst({
      where: { id: postId, agencyId },
      include: {
        client: true,
        campaign: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            approvals: {
              include: {
                comments: {
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true },
                    },
                  },
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!post) {
      throw new AppError('Content post not found.', 404);
    }

    return post;
  }

  static async createPost(agencyId: string, userId: string, input: CreatePostInput) {
    // Validate client belongs to agency
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, agencyId },
    });
    if (!client) {
      throw new AppError('Client not found in your agency workspace.', 404);
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.contentPost.create({
        data: {
          agencyId,
          clientId: input.clientId,
          campaignId: input.campaignId || null,
          creatorId: userId,
          title: input.title.trim(),
          caption: input.caption?.trim(),
          platform: input.platform || 'INSTAGRAM',
          status: input.status || 'DRAFT',
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
        },
      });

      // Automatically create Version 1 (V1)
      const v1 = await tx.contentVersion.create({
        data: {
          contentPostId: created.id,
          versionNumber: 1,
          mediaUrl: input.mediaUrl || null,
          mediaType: input.mediaType || 'image',
          captionCopy: input.caption?.trim(),
          createdById: userId,
        },
      });

      // If created with CLIENT_APPROVAL status, open formal approval record
      if (input.status === 'CLIENT_APPROVAL') {
        await tx.approval.create({
          data: {
            versionId: v1.id,
            clientId: input.clientId,
            status: 'PENDING',
          },
        });
      }

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CONTENT_POST_CREATED',
          entityType: 'CONTENT_POST',
          entityId: created.id,
          metadata: JSON.stringify({
            title: created.title,
            platform: created.platform,
          }),
        },
      });

      return created;
    });

    return this.getPostById(agencyId, post.id);
  }

  static async createNewVersion(
    agencyId: string,
    postId: string,
    userId: string,
    input: CreateVersionInput
  ) {
    const post = await prisma.contentPost.findFirst({
      where: { id: postId, agencyId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!post) {
      throw new AppError('Content post not found.', 404);
    }

    const nextVersionNumber = (post.versions[0]?.versionNumber || 1) + 1;

    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.contentVersion.create({
        data: {
          contentPostId: postId,
          versionNumber: nextVersionNumber,
          mediaUrl: input.mediaUrl || post.versions[0]?.mediaUrl || null,
          mediaType: input.mediaType || 'image',
          captionCopy: input.captionCopy || post.caption,
          createdById: userId,
        },
      });

      // Update post status to CLIENT_APPROVAL and open a new pending approval
      await tx.contentPost.update({
        where: { id: postId },
        data: {
          status: 'CLIENT_APPROVAL',
          caption: input.captionCopy || post.caption,
        },
      });

      await tx.approval.create({
        data: {
          versionId: version.id,
          clientId: post.clientId,
          status: 'PENDING',
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CONTENT_VERSION_CREATED',
          entityType: 'CONTENT_VERSION',
          entityId: version.id,
          metadata: JSON.stringify({
            postTitle: post.title,
            versionNumber: nextVersionNumber,
          }),
        },
      });

      return version;
    });

    return newVersion;
  }

  static async reviewApproval(
    agencyId: string,
    approvalId: string,
    reviewerUserId: string,
    input: ReviewApprovalInput
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        version: {
          include: {
            contentPost: true,
          },
        },
      },
    });

    if (!approval || approval.version.contentPost.agencyId !== agencyId) {
      throw new AppError('Approval record not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const appRecord = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: input.status,
          decisionNote: input.feedbackText?.trim(),
          decidedAt: new Date(),
        },
      });

      // If feedback provided, record in approval comments
      if (input.feedbackText?.trim()) {
        await tx.approvalComment.create({
          data: {
            approvalId,
            userId: reviewerUserId,
            message: input.feedbackText.trim(),
          },
        });
      }

      // Map approval status to post status
      let postStatus = 'CLIENT_APPROVAL';
      if (input.status === 'APPROVED') {
        postStatus = 'APPROVED';
      } else if (input.status === 'CHANGES_REQUESTED') {
        postStatus = 'INTERNAL_REVIEW';
      } else if (input.status === 'REJECTED') {
        postStatus = 'DRAFT';
      }

      await tx.contentPost.update({
        where: { id: approval.version.contentPostId },
        data: { status: postStatus },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId: reviewerUserId,
          action: `CONTENT_${input.status}`,
          entityType: 'APPROVAL',
          entityId: approvalId,
          metadata: JSON.stringify({
            postTitle: approval.version.contentPost.title,
            version: approval.version.versionNumber,
            decision: input.status,
          }),
        },
      });

      return appRecord;
    });

    return updated;
  }

  // Client Portal specific query
  static async listPortalApprovals(clientId: string) {
    return prisma.approval.findMany({
      where: {
        clientId,
      },
      include: {
        version: {
          include: {
            contentPost: {
              include: {
                campaign: { select: { id: true, name: true } },
              },
            },
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
