import { Router } from 'express';
import {
  ContentController,
  createPostSchema,
  createVersionSchema,
  reviewApprovalSchema,
} from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Internal agency content studio endpoints
router.get('/', authenticate, requireTenant, ContentController.listPosts);
router.get('/:id', authenticate, requireTenant, ContentController.getPostById);

router.post(
  '/',
  authenticate,
  requireTenant,
  validateRequest(createPostSchema),
  ContentController.createPost
);

router.post(
  '/:id/versions',
  authenticate,
  requireTenant,
  validateRequest(createVersionSchema),
  ContentController.createNewVersion
);

// Internal approval review or agency override
router.post(
  '/approvals/:id/review',
  authenticate,
  requireTenant,
  validateRequest(reviewApprovalSchema),
  ContentController.reviewApproval
);

export default router;
