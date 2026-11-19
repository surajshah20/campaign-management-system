import { Router } from 'express';
import {
  WorkspaceController,
  createWorkspaceSchema,
} from '../controllers/workspace.controller';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// Workspaces list and creation (authenticated user)
router.get('/', authenticate, WorkspaceController.listUserWorkspaces);
router.post(
  '/',
  authenticate,
  validateRequest(createWorkspaceSchema),
  WorkspaceController.createWorkspace
);

// Current workspace details (scoped to tenant)
router.get('/current', authenticate, requireTenant, WorkspaceController.getCurrentWorkspace);

// Current workspace executive overview metrics & feeds
router.get(
  '/current/overview',
  authenticate,
  requireTenant,
  WorkspaceController.getWorkspaceOverview
);

export default router;
