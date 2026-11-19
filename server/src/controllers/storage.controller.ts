import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StorageService } from '../services/storage.service';

export const uploadFileSchema = z.object({
  body: z.object({
    fileName: z.string().min(1, 'File name is required'),
    mimeType: z.string().min(1, 'MIME type is required'),
    base64Data: z.string().min(1, 'Base64 data is required'),
    storageProvider: z.enum(['LOCAL', 'S3', 'CLOUDINARY']).optional().default('LOCAL'),
  }),
});

export class StorageController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StorageService.uploadFile(
        req.tenant!.agencyId,
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const files = await StorageService.listFiles(req.tenant!.agencyId);
      res.status(200).json({ success: true, data: files });
    } catch (err) {
      next(err);
    }
  }

  static async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      await StorageService.deleteFile(
        req.tenant!.agencyId,
        req.user!.id,
        req.params.id as string
      );
      res.status(200).json({ success: true, message: 'File deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
