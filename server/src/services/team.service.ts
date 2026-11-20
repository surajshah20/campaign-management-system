import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';
import { AgencyRole, AgencyRoleType } from '../constants/roles';

export interface InviteMemberInput {
  email: string;
  role: AgencyRoleType;
}

export class TeamService {
  static async listMembers(agencyId: string) {
    const members = await prisma.agencyMember.findMany({
      where: { agencyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    }));
  }

  static async listInvitations(agencyId: string) {
    const now = new Date();
    return prisma.invitation.findMany({
      where: {
        agencyId,
        acceptedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async inviteMember(
    agencyId: string,
    inviterUserId: string,
    input: InviteMemberInput
  ) {
    const email = input.email.toLowerCase().trim();

    // Check if user is already a member
    const existingMember = await prisma.agencyMember.findFirst({
      where: {
        agencyId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new AppError('This user is already a member of this agency workspace.', 409);
    }

    // Check if an active invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        agencyId,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new AppError('A pending invitation for this email address already exists.', 409);
    }

    // Generate secure cryptographic token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.$transaction(async (tx) => {
      const created = await tx.invitation.create({
        data: {
          agencyId,
          email,
          role: input.role,
          tokenHash,
          expiresAt,
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId: inviterUserId,
          action: 'TEAM_MEMBER_INVITED',
          entityType: 'INVITATION',
          entityId: created.id,
          metadata: JSON.stringify({ email, role: input.role }),
        },
      });

      return created;
    });

    return {
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      // In development, return the raw invitation token for testing
      inviteToken: rawToken,
    };
  }

  static async getInvitationToken(
    agencyId: string,
    invitationId: string,
    _userId: string
  ) {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, agencyId, acceptedAt: null },
    });

    if (!invitation) {
      throw new AppError('Pending invitation not found.', 404);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { tokenHash, expiresAt },
    });

    return {
      inviteToken: rawToken,
    };
  }

  static async cancelInvitation(
    agencyId: string,
    invitationId: string,
    userId: string
  ) {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, agencyId },
    });

    if (!invitation) {
      throw new AppError('Invitation not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.invitation.delete({ where: { id: invitationId } });
      await tx.activityLog.create({
        data: {
          agencyId,
          userId,
          action: 'INVITATION_CANCELLED',
          entityType: 'INVITATION',
          entityId: invitationId,
          metadata: JSON.stringify({ email: invitation.email }),
        },
      });
    });

    return { success: true };
  }

  static async updateMemberRole(
    agencyId: string,
    membershipId: string,
    newRole: AgencyRoleType,
    operatorUserId: string
  ) {
    const membership = await prisma.agencyMember.findFirst({
      where: { id: membershipId, agencyId },
      include: { user: true },
    });

    if (!membership) {
      throw new AppError('Team member not found in this agency.', 404);
    }

    // Safety: prevent demoting the sole owner
    if (membership.role === AgencyRole.AGENCY_OWNER && newRole !== AgencyRole.AGENCY_OWNER) {
      const ownerCount = await prisma.agencyMember.count({
        where: { agencyId, role: AgencyRole.AGENCY_OWNER },
      });
      if (ownerCount <= 1) {
        throw new AppError(
          'Cannot demote the only Agency Owner. Assign another owner first.',
          400
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.agencyMember.update({
        where: { id: membershipId },
        data: { role: newRole },
      });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId: operatorUserId,
          action: 'MEMBER_ROLE_UPDATED',
          entityType: 'AGENCY_MEMBER',
          entityId: membershipId,
          metadata: JSON.stringify({
            targetUserId: membership.userId,
            newRole,
          }),
        },
      });

      return res;
    });

    return updated;
  }

  static async removeMember(
    agencyId: string,
    membershipId: string,
    operatorUserId: string
  ) {
    const membership = await prisma.agencyMember.findFirst({
      where: { id: membershipId, agencyId },
    });

    if (!membership) {
      throw new AppError('Team member not found in this agency.', 404);
    }

    if (membership.role === AgencyRole.AGENCY_OWNER) {
      const ownerCount = await prisma.agencyMember.count({
        where: { agencyId, role: AgencyRole.AGENCY_OWNER },
      });
      if (ownerCount <= 1) {
        throw new AppError(
          'Cannot remove the only Agency Owner from the workspace.',
          400
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.agencyMember.delete({ where: { id: membershipId } });

      await tx.activityLog.create({
        data: {
          agencyId,
          userId: operatorUserId,
          action: 'MEMBER_REMOVED',
          entityType: 'AGENCY_MEMBER',
          entityId: membershipId,
        },
      });
    });

    return { success: true };
  }
}
