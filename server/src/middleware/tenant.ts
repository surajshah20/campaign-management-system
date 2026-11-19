import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';
import { AgencyRoleType } from '../constants/roles';

export const requireTenant = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required before tenant resolution.', 401);
    }

    // Tenant identifier can come from header, cookie, or params, but MUST be validated against user memberships
    const requestedAgencyId =
      (req.headers['x-agency-id'] as string) ||
      req.cookies?.current_agency_id ||
      req.params?.agencyId;

    let membership;

    if (requestedAgencyId) {
      membership = await prisma.agencyMember.findFirst({
        where: {
          agencyId: requestedAgencyId,
          userId: req.user.id,
        },
        include: {
          agency: true,
        },
      });
    } else {
      // Default to the user's first available agency
      membership = await prisma.agencyMember.findFirst({
        where: {
          userId: req.user.id,
        },
        include: {
          agency: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (!membership) {
      throw new AppError(
        'Access denied: You do not have access to this agency workspace or no active agency workspace was found.',
        403
      );
    }

    req.tenant = {
      agencyId: membership.agency.id,
      agencyName: membership.agency.name,
      agencySlug: membership.agency.slug,
      role: membership.role as AgencyRoleType,
      currency: membership.agency.currency || 'NPR',
    };

    return next();
  } catch (error) {
    return next(error);
  }
};
