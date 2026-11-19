import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface CreateTaskInput {
  title: string;
  description?: string;
  clientId?: string;
  campaignId?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  clientId?: string;
  campaignId?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
}

export class TaskService {
  static async listTasks(
    agencyId: string,
    filters?: {
      campaignId?: string;
      clientId?: string;
      assigneeId?: string;
      status?: string;
      priority?: string;
    }
  ) {
    const where: any = { agencyId };

    if (filters?.campaignId && filters.campaignId !== 'ALL') {
      where.campaignId = filters.campaignId;
    }
    if (filters?.clientId && filters.clientId !== 'ALL') {
      where.clientId = filters.clientId;
    }
    if (filters?.assigneeId && filters.assigneeId !== 'ALL') {
      where.assigneeId = filters.assigneeId;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority;
    }

    return prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        client: {
          select: { id: true, name: true },
        },
        campaign: {
          select: { id: true, name: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  static async getTaskById(agencyId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, agencyId },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        client: true,
        campaign: true,
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found or you lack permission.', 404);
    }

    return task;
  }

  static async createTask(agencyId: string, userId: string, input: CreateTaskInput) {
    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          agencyId,
          title: input.title.trim(),
          description: input.description?.trim(),
          clientId: input.clientId || null,
          campaignId: input.campaignId || null,
          assigneeId: input.assigneeId || null,
          priority: input.priority || 'MEDIUM',
          status: input.status || 'TODO',
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          client: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'TASK_CREATED',
          entityType: 'TASK',
          entityId: created.id,
          metadata: JSON.stringify({ title: created.title, status: created.status }),
        },
      });

      return created;
    });

    return task;
  }

  static async updateTask(
    agencyId: string,
    taskId: string,
    userId: string,
    input: UpdateTaskInput
  ) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, agencyId },
    });

    if (!existing) {
      throw new AppError('Task not found or you lack permission.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          title: input.title?.trim(),
          description: input.description?.trim(),
          clientId: input.clientId,
          campaignId: input.campaignId,
          assigneeId: input.assigneeId,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          client: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'TASK_UPDATED',
          entityType: 'TASK',
          entityId: taskId,
          metadata: JSON.stringify({
            title: task.title,
            status: task.status,
            priority: task.priority,
          }),
        },
      });

      return task;
    });

    return updated;
  }

  static async updateTaskStatus(
    agencyId: string,
    taskId: string,
    userId: string,
    status: string
  ) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, agencyId },
    });

    if (!existing) {
      throw new AppError('Task not found.', 404);
    }

    return prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: { status },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
          entityType: 'TASK',
          entityId: taskId,
          metadata: JSON.stringify({ oldStatus: existing.status, newStatus: status }),
        },
      });

      return task;
    });
  }

  static async deleteTask(agencyId: string, taskId: string, userId: string) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, agencyId },
    });

    if (!existing) {
      throw new AppError('Task not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: taskId } });
      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'TASK_DELETED',
          entityType: 'TASK',
          entityId: taskId,
          metadata: JSON.stringify({ title: existing.title }),
        },
      });
    });

    return { success: true };
  }

  static async addComment(
    agencyId: string,
    taskId: string,
    userId: string,
    content: string
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, agencyId },
    });

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return comment;
  }
}
