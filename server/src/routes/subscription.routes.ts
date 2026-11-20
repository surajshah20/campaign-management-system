import { Router } from 'express';
import {
  SubscriptionController,
  changePlanSchema,
  updatePaymentMethodSchema,
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Public plan catalog
router.get('/plans', SubscriptionController.getPlans);

// Authenticated tenant billing operations
router.use(authenticate, requireTenant);

router.get('/current', SubscriptionController.getSubscription);
router.post('/plan', validateRequest(changePlanSchema), SubscriptionController.changePlan);
router.post('/payment-method', validateRequest(updatePaymentMethodSchema), SubscriptionController.updatePaymentMethod);
router.post('/cancel', SubscriptionController.cancel);
router.post('/resume', SubscriptionController.resume);
router.get('/invoices', SubscriptionController.listInvoices);
router.get('/quota', SubscriptionController.checkQuota);

export default router;
