import { Router } from 'express';
import {
  ClientController,
  createClientSchema,
  updateClientSchema,
} from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', requirePermission('client:view'), ClientController.listClients);
router.get('/:id', requirePermission('client:view'), ClientController.getClientById);

router.post(
  '/',
  requirePermission('client:create'),
  validateRequest(createClientSchema),
  ClientController.createClient
);

router.patch(
  '/:id',
  requirePermission('client:edit'),
  validateRequest(updateClientSchema),
  ClientController.updateClient
);

router.delete(
  '/:id',
  requirePermission('client:delete'),
  ClientController.deleteClient
);

export default router;
