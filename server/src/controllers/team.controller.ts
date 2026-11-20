import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TeamService } from '../services/team.service';
import { AgencyRole } from '../constants/roles';

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    role: z.enum([
      AgencyRole.AGENCY_OWNER,
      AgencyRole.AGENCY_ADMIN,
      AgencyRole.CAMPAIGN_MANAGER,
      AgencyRole.DESIGNER,
      AgencyRole.CONTENT_WRITER,
      AgencyRole.MARKETING_EXECUTIVE,
    ]),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    role: z.enum([
      AgencyRole.AGENCY_OWNER,
      AgencyRole.AGENCY_ADMIN,
      AgencyRole.CAMPAIGN_MANAGER,
      AgencyRole.DESIGNER,
      AgencyRole.CONTENT_WRITER,
      AgencyRole.MARKETING_EXECUTIVE,
    ]),
  }),
});

export class TeamController {
  static async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await TeamService.listMembers(req.tenant!.agencyId);
      return res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async listInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const invitations = await TeamService.listInvitations(req.tenant!.agencyId);
      return res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TeamService.inviteMember(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getInvitationToken(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TeamService.getInvitationToken(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async cancelInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      await TeamService.cancelInvitation(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        message: 'Invitation cancelled.',
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await TeamService.updateMemberRole(
        req.tenant!.agencyId,
        req.params.id as string,
        req.body.role,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await TeamService.removeMember(
        req.tenant!.agencyId,
        req.params.id as string,
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        message: 'Member removed from agency.',
      });
    } catch (error) {
      return next(error);
    }
  }
}
