import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContentService } from '../services/content.service';

export const createPostSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Valid client ID is required'),
    campaignId: z.string().uuid().optional().or(z.literal('')),
    title: z.string().min(2, 'Post title must be at least 2 characters'),
    caption: z.string().optional(),
    platform: z.enum([
      'FACEBOOK',
      'INSTAGRAM',
      'TIKTOK',
      'YOUTUBE',
      'LINKEDIN',
      'TWITTER_X',
    ]).optional(),
    status: z.enum([
      'IDEA',
      'DRAFT',
      'INTERNAL_REVIEW',
      'CLIENT_APPROVAL',
      'APPROVED',
      'SCHEDULED',
      'PUBLISHED',
    ]).optional(),
    scheduledDate: z.string().optional(),
    mediaUrl: z.string().url().optional().or(z.literal('')),
    mediaType: z.string().optional(),
  }),
});

export const createVersionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    mediaUrl: z.string().url().optional().or(z.literal('')),
    mediaType: z.string().optional(),
    captionCopy: z.string().optional(),
  }),
});

export const reviewApprovalSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED']),
    feedbackText: z.string().optional(),
  }),
});

export class ContentController {
  static async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, campaignId, platform, status, startDate, endDate } =
        req.query as {
          clientId?: string;
          campaignId?: string;
          platform?: string;
          status?: string;
          startDate?: string;
          endDate?: string;
        };

      const posts = await ContentService.listPosts(req.tenant!.agencyId, {
        clientId,
        campaignId,
        platform,
        status,
        startDate,
        endDate,
      });

      return res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await ContentService.getPostById(
        req.tenant!.agencyId,
        req.params.id as string
      );
      return res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await ContentService.createPost(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createNewVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const version = await ContentService.createNewVersion(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: version,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async reviewApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const approval = await ContentService.reviewApproval(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        data: approval,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Client Portal endpoint
  static async listPortalApprovals(req: Request, res: Response, next: NextFunction) {
    try {
      // Find client memberships for the authenticated user
      const clientMember = await prisma.clientMember.findFirst({
        where: { userId: req.user!.id },
      });

      if (!clientMember) {
        return res.status(200).json({ success: true, data: [] });
      }

      const approvals = await ContentService.listPortalApprovals(clientMember.clientId);
      return res.status(200).json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      return next(error);
    }
  }
}
import { prisma } from '../db/prisma';
