import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CampaignService } from '../services/campaign.service';

export const createCampaignSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Valid client ID is required'),
    name: z.string().min(2, 'Campaign name must be at least 2 characters'),
    description: z.string().optional(),
    objective: z.string().optional(),
    campaignType: z.enum([
      'SOCIAL_MEDIA_MARKETING',
      'PAID_ADVERTISING',
      'BRAND_AWARENESS',
      'LEAD_GENERATION',
      'PRODUCT_PROMOTION',
      'EVENT_PROMOTION',
      'EMAIL_MARKETING',
      'CONTENT_MARKETING',
    ]).optional(),
    status: z.enum([
      'DRAFT',
      'PLANNING',
      'ACTIVE',
      'PAUSED',
      'COMPLETED',
      'ARCHIVED',
    ]).optional(),
    allocatedBudget: z.number().min(0).optional(),
    targetAudience: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const updateCampaignSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    clientId: z.string().uuid().optional(),
    description: z.string().optional(),
    objective: z.string().optional(),
    campaignType: z.string().optional(),
    status: z.enum([
      'DRAFT',
      'PLANNING',
      'ACTIVE',
      'PAUSED',
      'COMPLETED',
      'ARCHIVED',
    ]).optional(),
    allocatedBudget: z.number().min(0).optional(),
    targetAudience: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export class CampaignController {
  static async listCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, status, search } = req.query as {
        clientId?: string;
        status?: string;
        search?: string;
      };
      const campaigns = await CampaignService.listCampaigns(
        req.tenant!.agencyId,
        { clientId, status, search }
      );
      return res.status(200).json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.getCampaignById(
        req.tenant!.agencyId,
        req.params.id as string
      );
      return res.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.createCampaign(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await CampaignService.updateCampaign(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      await CampaignService.deleteCampaign(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully.',
      });
    } catch (error) {
      return next(error);
    }
  }
}
