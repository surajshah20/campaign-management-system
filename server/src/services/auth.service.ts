import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { AgencyRole } from '../constants/roles';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  agencyName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Generate clean unique slug
    let baseSlug = input.agencyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'agency';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.agency.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Atomic transaction: create User, Agency, and AgencyMember (AGENCY_OWNER)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
        },
      });

      const agency = await tx.agency.create({
        data: {
          name: input.agencyName.trim(),
          slug: uniqueSlug,
          currency: config.defaultCurrency,
        },
      });

      const member = await tx.agencyMember.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          role: AgencyRole.AGENCY_OWNER,
        },
      });

      await tx.activityLog.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          action: 'AGENCY_WORKSPACE_CREATED',
          entityType: 'AGENCY',
          entityId: agency.id,
          metadata: JSON.stringify({ agencyName: agency.name }),
        },
      });

      return { user, agency, member };
    });

    const token = this.generateToken(result.user.id, result.user.email);

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      currentAgency: {
        id: result.agency.id,
        name: result.agency.name,
        slug: result.agency.slug,
        role: result.member.role,
        currency: result.agency.currency,
      },
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            agency: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const primaryMembership = user.memberships[0];
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      currentAgency: primaryMembership
        ? {
            id: primaryMembership.agency.id,
            name: primaryMembership.agency.name,
            slug: primaryMembership.agency.slug,
            role: primaryMembership.role,
            currency: primaryMembership.agency.currency,
          }
        : null,
      availableAgencies: user.memberships.map((m) => ({
        id: m.agency.id,
        name: m.agency.name,
        slug: m.agency.slug,
        role: m.role,
      })),
    };
  }

  static async getProfile(userId: string, currentAgencyId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { agency: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    const activeMembership = currentAgencyId
      ? user.memberships.find((m) => m.agencyId === currentAgencyId)
      : user.memberships[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
      },
      currentAgency: activeMembership
        ? {
            id: activeMembership.agency.id,
            name: activeMembership.agency.name,
            slug: activeMembership.agency.slug,
            role: activeMembership.role,
            currency: activeMembership.agency.currency,
          }
        : null,
      availableAgencies: user.memberships.map((m) => ({
        id: m.agency.id,
        name: m.agency.name,
        slug: m.agency.slug,
        role: m.role,
      })),
    };
  }

  static async getInvitationDetails(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    const invitation = await prisma.invitation.findFirst({
      where: {
        tokenHash,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        agency: { select: { id: true, name: true, logoUrl: true, currency: true } },
      },
    });

    if (!invitation) {
      throw new AppError('Invitation is invalid, expired, or has already been accepted.', 404);
    }

    return {
      email: invitation.email,
      role: invitation.role,
      agency: invitation.agency,
    };
  }

  static async acceptInvitation(input: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    const tokenHash = crypto.createHash('sha256').update(input.token.trim()).digest('hex');

    const invitation = await prisma.invitation.findFirst({
      where: {
        tokenHash,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        agency: true,
      },
    });

    if (!invitation) {
      throw new AppError('Invitation is invalid, expired, or has already been accepted.', 404);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const result = await prisma.$transaction(async (tx) => {
      // Find or create User
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            emailVerified: true,
          },
        });
      } else {
        // Update credentials if user already existed
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            emailVerified: true,
          },
        });
      }

      // Add to AgencyMember
      const existingMembership = await tx.agencyMember.findUnique({
        where: {
          agencyId_userId: {
            agencyId: invitation.agencyId,
            userId: user.id,
          },
        },
      });

      if (!existingMembership) {
        await tx.agencyMember.create({
          data: {
            agencyId: invitation.agencyId,
            userId: user.id,
            role: invitation.role,
          },
        });
      }

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          agencyId: invitation.agencyId,
          userId: user.id,
          action: 'INVITATION_ACCEPTED',
          entityType: 'INVITATION',
          entityId: invitation.id,
          metadata: JSON.stringify({
            email: user.email,
            role: invitation.role,
            agencyName: invitation.agency.name,
          }),
        },
      });

      return { user, agency: invitation.agency, role: invitation.role };
    });

    const jwtToken = this.generateToken(result.user.id, result.user.email);

    return {
      token: jwtToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        avatarUrl: result.user.avatarUrl,
        isSuperAdmin: result.user.isSuperAdmin,
      },
      currentAgency: {
        id: result.agency.id,
        name: result.agency.name,
        slug: result.agency.slug,
        role: result.role,
        currency: result.agency.currency,
      },
    };
  }

  private static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: '7d',
    });
  }
}
