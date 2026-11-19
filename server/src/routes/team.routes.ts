import { Router } from 'express';
import {
  TeamController,
  inviteMemberSchema,
  updateRoleSchema,
} from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/members', TeamController.listMembers);
router.get('/invitations', requirePermission('team:invite'), TeamController.listInvitations);

router.post(
  '/invite',
  requirePermission('team:invite'),
  validateRequest(inviteMemberSchema),
  TeamController.inviteMember
);

router.delete(
  '/invitations/:id',
  requirePermission('team:invite'),
  TeamController.cancelInvitation
);

router.patch(
  '/members/:id/role',
  requirePermission('team:manage'),
  validateRequest(updateRoleSchema),
  TeamController.updateMemberRole
);

router.delete(
  '/members/:id',
  requirePermission('team:manage'),
  TeamController.removeMember
);

export default router;
