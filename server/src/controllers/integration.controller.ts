import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IntegrationService } from '../services/integration.service';

export const configureIntegrationSchema = z.object({
  body: z.object({
    provider: z.enum([
      'META_ADS',
      'GOOGLE_ADS',
      'TIKTOK_ADS',
      'LINKEDIN_ADS',
      'STORAGE_S3',
      'STORAGE_CLOUDINARY',
    ]),
    name: z.string().min(2),
    credentials: z.record(z.any()),
  }),
});

export const triggerSyncSchema = z.object({
  body: z.object({
    provider: z.string().min(2),
  }),
});

export class IntegrationController {
  static async listCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const integrations = await IntegrationService.listIntegrations(req.tenant!.agencyId);
      res.status(200).json({ success: true, data: integrations });
    } catch (err) {
      next(err);
    }
  }

  static async configure(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await IntegrationService.configureIntegration(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      res.status(200).json({ success: true, data: integration });
    } catch (err) {
      next(err);
    }
  }

  static async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      await IntegrationService.disconnectIntegration(
        req.tenant!.agencyId,
        req.user!.id,
        req.params.provider as string
      );
      res.status(200).json({ success: true, message: 'Integration disconnected' });
    } catch (err) {
      next(err);
    }
  }

  static async triggerSync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await IntegrationService.triggerSync(
        req.tenant!.agencyId,
        req.user!.id,
        req.body.provider
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getSyncLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await IntegrationService.getSyncLogs(
        req.tenant!.agencyId,
        req.query.integrationId as string | undefined
      );
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await IntegrationService.handleWebhook(
        req.params.provider as string,
        req.body,
        req.headers['x-hub-signature-256'] as string | undefined
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
