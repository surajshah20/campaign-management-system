import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  static async getOverviewAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId, platform, days } = req.query as {
        campaignId?: string;
        platform?: string;
        days?: string;
      };

      const parsedDays = days ? parseInt(days, 10) : 30;

      const data = await AnalyticsService.getOverviewAnalytics(
        req.tenant!.agencyId,
        {
          campaignId,
          platform,
          days: parsedDays,
        }
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}
