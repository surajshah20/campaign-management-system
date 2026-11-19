import { Router } from 'express';
import {
  AdvertisingController,
  createAdAccountSchema,
  createAdCampaignSchema,
  logMetricSchema,
  ingestCsvSchema,
} from '../controllers/advertising.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

// Ad Accounts
router.get('/accounts', AdvertisingController.listAccounts);
router.post('/accounts', validateRequest(createAdAccountSchema), AdvertisingController.createAccount);

// Paid Ad Campaigns
router.get('/campaigns', AdvertisingController.listAdCampaigns);
router.post('/campaigns', validateRequest(createAdCampaignSchema), AdvertisingController.createAdCampaign);

// Metrics Ingestion
router.post('/metrics', validateRequest(logMetricSchema), AdvertisingController.logMetric);
router.post('/metrics/csv', validateRequest(ingestCsvSchema), AdvertisingController.ingestCsv);

export default router;
