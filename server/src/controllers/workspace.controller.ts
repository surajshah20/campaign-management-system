import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WorkspaceService } from '../services/workspace.service';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters'),
    currency: z.string().optional().default('NPR'),
    timezone: z.string().optional().default('Asia/Kathmandu'),
  }),
});

export class WorkspaceController {
  static async listUserWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.listUserWorkspaces(req.user!.id);
      return res.status(200).json({
        success: true,
        data: workspaces,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = await WorkspaceService.createWorkspace(req.user!.id, req.body);
      return res.status(201).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getCurrentWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = await WorkspaceService.getWorkspaceDetails(
        req.tenant!.agencyId,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getWorkspaceOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await WorkspaceService.getWorkspaceOverview(req.tenant!.agencyId);
      return res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      return next(error);
    }
  }
}
