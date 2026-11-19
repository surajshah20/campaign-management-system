import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ClientService } from '../services/client.service';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Client name must be at least 2 characters'),
    logoUrl: z.string().url().optional().or(z.literal('')),
    industry: z.string().optional(),
    contactPerson: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().optional(),
    assignedManagerId: z.string().uuid().optional().or(z.literal('')),
    status: z.enum(['ONBOARDING', 'ACTIVE', 'PAUSED', 'INACTIVE']).optional(),
    internalNotes: z.string().optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    industry: z.string().optional(),
    contactPerson: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().optional(),
    assignedManagerId: z.string().uuid().optional().or(z.literal('')),
    status: z.enum(['ONBOARDING', 'ACTIVE', 'PAUSED', 'INACTIVE']).optional(),
    internalNotes: z.string().optional(),
  }),
});

export class ClientController {
  static async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query as { status?: string; search?: string };
      const clients = await ClientService.listClients(req.tenant!.agencyId, {
        status,
        search,
      });
      return res.status(200).json({
        success: true,
        data: clients,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.getClientById(
        req.tenant!.agencyId,
        req.params.id
      );
      return res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.createClient(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.updateClient(
        req.tenant!.agencyId,
        req.params.id,
        req.user!.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      await ClientService.deleteClient(
        req.tenant!.agencyId,
        req.params.id,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        message: 'Client deleted successfully.',
      });
    } catch (error) {
      return next(error);
    }
  }
}
