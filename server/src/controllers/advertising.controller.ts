import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdvertisingService } from '../services/advertising.service';

export const createAdAccountSchema = z.object({
  body: z.object({
    platform: z.enum(['META_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS', 'LINKEDIN_ADS']),
    accountName: z.string().min(2, 'Account name must be at least 2 characters'),
    externalId: z.string().optional(),
    currency: z.string().optional().default('NPR'),
  }),
});

export const createAdCampaignSchema = z.object({
  body: z.object({
    campaignId: z.string().uuid('Valid marketing campaign ID is required'),
    adAccountId: z.string().uuid().optional().or(z.literal('')),
    name: z.string().min(2, 'Ad campaign name must be at least 2 characters'),
    platform: z.enum(['META_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS', 'LINKEDIN_ADS']),
    budgetAmount: z.number().min(0).optional(),
    spendAmount: z.number().min(0).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const logMetricSchema = z.object({
  body: z.object({
    adCampaignId: z.string().uuid('Valid Ad Campaign ID is required'),
    date: z.string().min(1, 'Date is required'),
    impressions: z.number().min(0).optional(),
    reach: z.number().min(0).optional(),
    clicks: z.number().min(0).optional(),
    spend: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
    leads: z.number().min(0).optional(),
    revenue: z.number().min(0).optional(),
  }),
});

export const ingestCsvSchema = z.object({
  body: z.object({
    adCampaignId: z.string().uuid('Valid Ad Campaign ID is required'),
    csvRows: z.string().min(5, 'CSV content is required'),
  }),
});

export class AdvertisingController {
  static async listAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await AdvertisingService.listAccounts(req.tenant!.agencyId);
      return res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await AdvertisingService.createAccount(
        req.tenant!.agencyId,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async listAdCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform, campaignId } = req.query as {
        platform?: string;
        campaignId?: string;
      };
      const campaigns = await AdvertisingService.listAdCampaigns(
        req.tenant!.agencyId,
        { platform, campaignId }
      );
      return res.status(200).json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createAdCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const adCampaign = await AdvertisingService.createAdCampaign(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: adCampaign,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async logMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const metric = await AdvertisingService.logMetric(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: metric,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async ingestCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdvertisingService.ingestCsvMetrics(
        req.tenant!.agencyId,
        req.user!.id,
        req.body.adCampaignId,
        req.body.csvRows
      );
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}
