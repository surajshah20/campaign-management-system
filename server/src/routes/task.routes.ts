import { Router } from 'express';
import {
  TaskController,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  addCommentSchema,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', TaskController.listTasks);
router.get('/:id', TaskController.getTaskById);

router.post('/', validateRequest(createTaskSchema), TaskController.createTask);
router.patch('/:id', validateRequest(updateTaskSchema), TaskController.updateTask);
router.patch(
  '/:id/status',
  validateRequest(updateTaskStatusSchema),
  TaskController.updateTaskStatus
);
router.delete('/:id', TaskController.deleteTask);
router.post(
  '/:id/comments',
  validateRequest(addCommentSchema),
  TaskController.addComment
);

export default router;
