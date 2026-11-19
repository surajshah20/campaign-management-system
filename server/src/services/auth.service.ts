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

  private static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: '7d',
    });
  }
}
