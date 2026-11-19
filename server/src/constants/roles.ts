export const AgencyRole = {
  AGENCY_OWNER: 'AGENCY_OWNER',
  AGENCY_ADMIN: 'AGENCY_ADMIN',
  CAMPAIGN_MANAGER: 'CAMPAIGN_MANAGER',
  DESIGNER: 'DESIGNER',
  CONTENT_WRITER: 'CONTENT_WRITER',
  MARKETING_EXECUTIVE: 'MARKETING_EXECUTIVE',
} as const;

export type AgencyRoleType = (typeof AgencyRole)[keyof typeof AgencyRole];

export type Permission =
  | 'agency:manage'
  | 'agency:billing'
  | 'team:invite'
  | 'team:manage'
  | 'client:create'
  | 'client:edit'
  | 'client:delete'
  | 'client:view'
  | 'campaign:create'
  | 'campaign:edit'
  | 'campaign:delete'
  | 'campaign:view'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:assign'
  | 'content:create'
  | 'content:edit'
  | 'content:approve_internal'
  | 'content:publish'
  | 'ads:manage'
  | 'budget:manage'
  | 'report:generate'
  | 'report:share';

export const ROLE_PERMISSIONS: Record<AgencyRoleType, Permission[]> = {
  AGENCY_OWNER: [
    'agency:manage',
    'agency:billing',
    'team:invite',
    'team:manage',
    'client:create',
    'client:edit',
    'client:delete',
    'client:view',
    'campaign:create',
    'campaign:edit',
    'campaign:delete',
    'campaign:view',
    'task:create',
    'task:edit',
    'task:delete',
    'task:assign',
    'content:create',
    'content:edit',
    'content:approve_internal',
    'content:publish',
    'ads:manage',
    'budget:manage',
    'report:generate',
    'report:share',
  ],
  AGENCY_ADMIN: [
    'agency:manage',
    'team:invite',
    'team:manage',
    'client:create',
    'client:edit',
    'client:delete',
    'client:view',
    'campaign:create',
    'campaign:edit',
    'campaign:delete',
    'campaign:view',
    'task:create',
    'task:edit',
    'task:delete',
    'task:assign',
    'content:create',
    'content:edit',
    'content:approve_internal',
    'content:publish',
    'ads:manage',
    'budget:manage',
    'report:generate',
    'report:share',
  ],
  CAMPAIGN_MANAGER: [
    'client:view',
    'campaign:create',
    'campaign:edit',
    'campaign:view',
    'task:create',
    'task:edit',
    'task:assign',
    'content:create',
    'content:edit',
    'content:approve_internal',
    'ads:manage',
    'budget:manage',
    'report:generate',
    'report:share',
  ],
  DESIGNER: [
    'client:view',
    'campaign:view',
    'task:edit',
    'content:create',
    'content:edit',
  ],
  CONTENT_WRITER: [
    'client:view',
    'campaign:view',
    'task:edit',
    'content:create',
    'content:edit',
  ],
  MARKETING_EXECUTIVE: [
    'client:view',
    'campaign:view',
    'ads:manage',
    'budget:manage',
    'report:generate',
    'task:edit',
  ],
};
