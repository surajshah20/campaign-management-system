import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { ContentService } from '../services/content.service';
import { validateRequest } from '../middleware/validate';
import { reviewApprovalSchema } from '../controllers/content.controller';

const router = Router();

// Client Portal Authentication Guard: verifies user is a client member
const requireClientPortalUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const clientMember = await prisma.clientMember.findFirst({
      where: { userId: req.user.id },
      include: {
        client: {
          include: {
            agency: { select: { id: true, name: true, logoUrl: true, currency: true } },
          },
        },
      },
    });

    if (!clientMember) {
      throw new AppError(
        'Access denied: You do not have client portal access for any organization.',
        403
      );
    }

    req.tenant = {
      agencyId: clientMember.client.agency.id,
      agencyName: clientMember.client.agency.name,
      agencySlug: clientMember.client.name,
      role: 'CLIENT' as any,
      currency: clientMember.client.agency.currency || 'NPR',
      clientPortalClientId: clientMember.clientId,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

router.use(authenticate, requireClientPortalUser);

// Get client portal overview / profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.tenant!.clientPortalClientId! },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        industry: true,
        status: true,
        agency: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        client,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// List pending & historical approvals for this client
router.get('/approvals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = await ContentService.listPortalApprovals(
      req.tenant!.clientPortalClientId!
    );
    return res.status(200).json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    return next(error);
  }
});

// Review an approval (Approve, Request Changes, Reject)
router.post(
  '/approvals/:id/review',
  validateRequest(reviewApprovalSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await ContentService.reviewApproval(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        data: approval,
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
