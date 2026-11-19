import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { prisma } from '../db/prisma';
import { AuthenticatedUser } from '../@types/express';

interface TokenPayload {
  userId: string;
  email: string;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.access_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. No session token found.', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
      },
    });

    if (!user) {
      throw new AppError('User session is invalid or user has been deleted.', 401);
    }

    req.user = user as AuthenticatedUser;
    return next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication token.', 401));
    }
    return next(error);
  }
};
