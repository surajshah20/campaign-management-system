import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    agencyName: z.string().min(2, 'Agency workspace name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      // Set secure HTTP-only cookie
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      if (result.currentAgency) {
        res.cookie('current_agency_id', result.currentAgency.id, {
          httpOnly: false, // readable by client for UI state synchronization
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          user: result.user,
          currentAgency: result.currentAgency,
          token: result.token,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (result.currentAgency) {
        res.cookie('current_agency_id', result.currentAgency.id, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          currentAgency: result.currentAgency,
          availableAgencies: result.availableAgencies,
          token: result.token,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('current_agency_id');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const currentAgencyId =
        (req.headers['x-agency-id'] as string) || req.cookies?.current_agency_id;

      const profile = await AuthService.getProfile(req.user!.id, currentAgencyId);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      return next(error);
    }
  }
}
