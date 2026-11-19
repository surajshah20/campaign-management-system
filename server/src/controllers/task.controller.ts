import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/task.service';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title must be at least 2 characters'),
    description: z.string().optional(),
    clientId: z.string().uuid().optional().or(z.literal('')),
    campaignId: z.string().uuid().optional().or(z.literal('')),
    assigneeId: z.string().uuid().optional().or(z.literal('')),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
    dueDate: z.string().optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    clientId: z.string().uuid().optional().or(z.literal('')),
    campaignId: z.string().uuid().optional().or(z.literal('')),
    assigneeId: z.string().uuid().optional().or(z.literal('')),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
    dueDate: z.string().optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']),
  }),
});

export const addCommentSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    content: z.string().min(1, 'Comment text is required'),
  }),
});

export class TaskController {
  static async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId, clientId, assigneeId, status, priority } = req.query as {
        campaignId?: string;
        clientId?: string;
        assigneeId?: string;
        status?: string;
        priority?: string;
      };
      const tasks = await TaskService.listTasks(req.tenant!.agencyId, {
        campaignId,
        clientId,
        assigneeId,
        status,
        priority,
      });
      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.getTaskById(
        req.tenant!.agencyId,
        req.params.id as string
      );
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.createTask(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.updateTask(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.updateTaskStatus(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body.status
      );
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      await TaskService.deleteTask(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully.',
      });
    } catch (error) {
      return next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await TaskService.addComment(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body.content
      );
      return res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      return next(error);
    }
  }
}
