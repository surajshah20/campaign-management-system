import { Router } from 'express';
import {
  CampaignController,
  createCampaignSchema,
  updateCampaignSchema,
} from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', requirePermission('campaign:view'), CampaignController.listCampaigns);
router.get('/:id', requirePermission('campaign:view'), CampaignController.getCampaignById);

router.post(
  '/',
  requirePermission('campaign:create'),
  validateRequest(createCampaignSchema),
  CampaignController.createCampaign
);

router.patch(
  '/:id',
  requirePermission('campaign:edit'),
  validateRequest(updateCampaignSchema),
  CampaignController.updateCampaign
);

router.delete(
  '/:id',
  requirePermission('campaign:delete'),
  CampaignController.deleteCampaign
);

export default router;
