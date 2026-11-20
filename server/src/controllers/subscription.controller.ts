import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.service';

export const changePlanSchema = z.object({
  body: z.object({
    plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
    billingCycle: z.enum(['MONTHLY', 'ANNUAL']).optional().default('MONTHLY'),
  }),
});

export const updatePaymentMethodSchema = z.object({
  body: z.object({
    brand: z.string().min(2),
    last4: z.string().length(4),
    expMonth: z.string().min(1).max(2),
    expYear: z.string().min(2).max(4),
  }),
});

export class SubscriptionController {
  static async getPlans(_req: Request, res: Response) {
    const plans = SubscriptionService.getPlans();
    res.status(200).json({ success: true, data: plans });
  }

  static async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriptionService.getOrCreateSubscription(req.tenant!.agencyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async changePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriptionService.changePlan(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updatePaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriptionService.updatePaymentMethod(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriptionService.cancelSubscription(
        req.tenant!.agencyId,
        req.user!.id
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriptionService.resumeSubscription(
        req.tenant!.agencyId,
        req.user!.id
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const invoices = await SubscriptionService.listInvoices(req.tenant!.agencyId);
      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }

  static async checkQuota(req: Request, res: Response, next: NextFunction) {
    try {
      const resource = (req.query.resource as any) || 'CLIENT';
      const quota = await SubscriptionService.checkQuota(req.tenant!.agencyId, resource);
      res.status(200).json({ success: true, data: quota });
    } catch (err) {
      next(err);
    }
  }
}
