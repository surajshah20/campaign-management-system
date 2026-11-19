import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReportService } from '../services/report.service';

export const createReportSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Valid client ID is required'),
    campaignId: z.string().uuid().optional().or(z.literal('')),
    title: z.string().min(2, 'Report title must be at least 2 characters'),
    observations: z.string().optional(),
    recommendations: z.string().optional(),
    isPubliclyShared: z.boolean().optional(),
  }),
});

export const updateReportSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    observations: z.string().optional(),
    recommendations: z.string().optional(),
    isPubliclyShared: z.boolean().optional(),
  }),
});

export class ReportController {
  static async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.generateReport(
        req.tenant!.agencyId,
        req.user!.id,
        {
          ...req.body,
          campaignId: req.body.campaignId || undefined,
        }
      );
      res.status(201).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  static async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ReportService.listReports(req.tenant!.agencyId, {
        clientId: req.query.clientId as string | undefined,
        campaignId: req.query.campaignId as string | undefined,
      });
      res.status(200).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  static async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getReportById(
        req.tenant!.agencyId,
        req.params.id as string
      );
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  static async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.updateReport(
        req.tenant!.agencyId,
        req.user!.id,
        req.params.id as string,
        req.body
      );
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  static async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      await ReportService.deleteReport(
        req.tenant!.agencyId,
        req.user!.id,
        req.params.id as string
      );
      res.status(200).json({ success: true, message: 'Report deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async getPublicReport(req: Request, res: Response, next: NextFunction) {
    try {
      const presentation = await ReportService.getPublicReport(req.params.token as string);
      res.status(200).json({ success: true, data: presentation });
    } catch (err) {
      next(err);
    }
  }
}
