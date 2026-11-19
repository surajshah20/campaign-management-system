import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface CreateClientInput {
  name: string;
  logoUrl?: string;
  industry?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  assignedManagerId?: string;
  status?: string;
  internalNotes?: string;
}

export interface UpdateClientInput {
  name?: string;
  logoUrl?: string;
  industry?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  assignedManagerId?: string;
  status?: string;
  internalNotes?: string;
}

export class ClientService {
  static async listClients(
    agencyId: string,
    filters?: { status?: string; search?: string }
  ) {
    const where: any = { agencyId };

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { contactPerson: { contains: filters.search } },
        { email: { contains: filters.search } },
        { industry: { contains: filters.search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            campaigns: true,
            tasks: true,
            contentPosts: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch manager names for assignedManagerId
    const managerIds = clients
      .map((c) => c.assignedManagerId)
      .filter((id): id is string => Boolean(id));

    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const managerMap = new Map(managers.map((m) => [m.id, m]));

    return clients.map((c) => ({
      ...c,
      assignedManager: c.assignedManagerId
        ? managerMap.get(c.assignedManagerId) || null
        : null,
    }));
  }

  static async getClientById(agencyId: string, clientId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, agencyId },
      include: {
        campaigns: {
          include: {
            _count: {
              select: { tasks: true, contentPosts: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            campaigns: true,
            tasks: true,
            contentPosts: true,
            reports: true,
          },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found or you do not have permission.', 404);
    }

    let assignedManager = null;
    if (client.assignedManagerId) {
      assignedManager = await prisma.user.findUnique({
        where: { id: client.assignedManagerId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    }

    return {
      ...client,
      assignedManager,
    };
  }

  static async createClient(
    agencyId: string,
    userId: string,
    input: CreateClientInput
  ) {
    const client = await prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          agencyId,
          name: input.name.trim(),
          logoUrl: input.logoUrl,
          industry: input.industry?.trim(),
          contactPerson: input.contactPerson?.trim(),
          email: input.email?.toLowerCase().trim(),
          phone: input.phone?.trim(),
          website: input.website?.trim(),
          assignedManagerId: input.assignedManagerId || null,
          status: input.status || 'ONBOARDING',
          internalNotes: input.internalNotes?.trim(),
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CLIENT_CREATED',
          entityType: 'CLIENT',
          entityId: created.id,
          metadata: JSON.stringify({ clientName: created.name }),
        },
      });

      return created;
    });

    return client;
  }

  static async updateClient(
    agencyId: string,
    clientId: string,
    userId: string,
    input: UpdateClientInput
  ) {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, agencyId },
    });

    if (!existing) {
      throw new AppError('Client not found or you lack permission.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id: clientId },
        data: {
          name: input.name?.trim(),
          logoUrl: input.logoUrl,
          industry: input.industry?.trim(),
          contactPerson: input.contactPerson?.trim(),
          email: input.email?.toLowerCase().trim(),
          phone: input.phone?.trim(),
          website: input.website?.trim(),
          assignedManagerId: input.assignedManagerId,
          status: input.status,
          internalNotes: input.internalNotes?.trim(),
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CLIENT_UPDATED',
          entityType: 'CLIENT',
          entityId: clientId,
          metadata: JSON.stringify({ clientName: client.name }),
        },
      });

      return client;
    });

    return updated;
  }

  static async deleteClient(agencyId: string, clientId: string, userId: string) {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, agencyId },
    });

    if (!existing) {
      throw new AppError('Client not found or you lack permission.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.client.delete({ where: { id: clientId } });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'CLIENT_DELETED',
          entityType: 'CLIENT',
          entityId: clientId,
          metadata: JSON.stringify({ clientName: existing.name }),
        },
      });
    });

    return { success: true };
  }
}
