import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Permission, ROLE_PERMISSIONS, AgencyRoleType } from '../constants/roles';

export const requirePermission = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return next(new AppError('Tenant context required for authorization.', 403));
    }

    const role = req.tenant.role as AgencyRoleType;
    const permissions = ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes(permission)) {
      return next(
        new AppError(
          `Forbidden: Role '${role}' lacks permission '${permission}' for this action.`,
          403
        )
      );
    }

    return next();
  };
};

export const requireRole = (allowedRoles: AgencyRoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return next(new AppError('Tenant context required for role verification.', 403));
    }

    if (!allowedRoles.includes(req.tenant.role)) {
      return next(
        new AppError(
          `Forbidden: Action restricted to roles: ${allowedRoles.join(', ')}.`,
          403
        )
      );
    }

    return next();
  };
};
