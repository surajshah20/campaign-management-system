import { AgencyRoleType } from '../constants/roles';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
}

export interface TenantContext {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  role: AgencyRoleType;
  currency: string;
  clientPortalClientId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: TenantContext;
    }
  }
}
