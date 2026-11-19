import { Router } from 'express';
import { StorageController, uploadFileSchema } from '../controllers/storage.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/files', StorageController.listFiles);
router.post('/upload', validateRequest(uploadFileSchema), StorageController.upload);
router.delete('/files/:id', StorageController.deleteFile);

export default router;
