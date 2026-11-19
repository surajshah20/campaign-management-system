import { Router } from 'express';
import {
  ReportController,
  createReportSchema,
  updateReportSchema,
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Public presentation share link - NO authentication required
router.get('/share/:token', ReportController.getPublicReport);

// Internal agency protected routes
router.use(authenticate, requireTenant);

router.get('/', ReportController.listReports);
router.post('/', validateRequest(createReportSchema), ReportController.generateReport);
router.get('/:id', ReportController.getReport);
router.patch('/:id', validateRequest(updateReportSchema), ReportController.updateReport);
router.delete('/:id', ReportController.deleteReport);

export default router;
