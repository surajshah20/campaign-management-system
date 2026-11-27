import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  acceptInvitationSchema,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

// Invitation onboarding routes
router.get('/invitation/:token', AuthController.getInvitation);
router.post(
  '/accept-invitation',
  authLimiter,
  validateRequest(acceptInvitationSchema),
  AuthController.acceptInvitation
);

export default router;
