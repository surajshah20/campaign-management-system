import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const activities = await prisma.activityLog.findMany({
      where: { agencyId: req.tenant!.agencyId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
