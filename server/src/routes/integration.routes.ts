import { Router } from 'express';
import {
  IntegrationController,
  configureIntegrationSchema,
  triggerSyncSchema,
} from '../controllers/integration.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Inbound webhook router from external platform APIs
router.post('/webhooks/:provider', IntegrationController.webhook);

// Agency protected endpoints
router.use(authenticate, requireTenant);

router.get('/', IntegrationController.listCatalog);
router.post('/configure', validateRequest(configureIntegrationSchema), IntegrationController.configure);
router.delete('/disconnect/:provider', IntegrationController.disconnect);
router.post('/sync', validateRequest(triggerSyncSchema), IntegrationController.triggerSync);
router.get('/logs', IntegrationController.getSyncLogs);

export default router;
