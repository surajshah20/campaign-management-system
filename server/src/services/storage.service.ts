import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/AppError';

export interface UploadFileInput {
  fileName: string;
  mimeType: string;
  base64Data: string; // base64 encoded file payload
  storageProvider?: 'LOCAL' | 'S3' | 'CLOUDINARY';
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/csv',
  'application/json',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export class StorageService {
  private static uploadsBaseDir = path.resolve(process.cwd(), 'uploads');

  private static ensureUploadDir(agencyId: string): string {
    const dir = path.join(this.uploadsBaseDir, agencyId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static async uploadFile(
    agencyId: string,
    userId: string,
    input: UploadFileInput
  ) {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new AppError(`File type "${input.mimeType}" is not supported. Allowed: images, videos, PDF, CSV.`, 400);
    }

    // Clean base64 header if present (e.g. "data:image/png;base64,iVBORw...")
    const rawBase64 = input.base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new AppError('File size exceeds the 25MB limit.', 400);
    }

    const provider = input.storageProvider || 'LOCAL';
    const ext = path.extname(input.fileName) || `.${input.mimeType.split('/')[1] || 'bin'}`;
    const uniqueFileId = crypto.randomBytes(16).toString('hex');
    const storedFileName = `${uniqueFileId}${ext}`;

    let publicUrl = '';

    if (provider === 'LOCAL') {
      const targetDir = this.ensureUploadDir(agencyId);
      const filePath = path.join(targetDir, storedFileName);
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/uploads/${agencyId}/${storedFileName}`;
    } else {
      // Cloud simulation (S3 / Cloudinary)
      publicUrl = `https://mock-cdn.agency-os.io/${agencyId}/${storedFileName}`;
    }

    const storageRecord = await prisma.storageFile.create({
      data: {
        agencyId,
        uploadedById: userId,
        fileName: input.fileName,
        fileSize: buffer.length,
        mimeType: input.mimeType,
        storageProvider: provider,
        publicUrl,
        metadataJson: JSON.stringify({
          originalName: input.fileName,
          byteSize: buffer.length,
          storedFileName,
        }),
      },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'ASSET_UPLOADED',
        entityType: 'ASSET',
        entityId: storageRecord.id,
        metadata: JSON.stringify({
          fileName: input.fileName,
          sizeBytes: buffer.length,
          provider,
        }),
      },
    });

    return storageRecord;
  }

  static async listFiles(agencyId: string) {
    return prisma.storageFile.findMany({
      where: { agencyId },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteFile(agencyId: string, userId: string, fileId: string) {
    const file = await prisma.storageFile.findFirst({
      where: { id: fileId, agencyId },
    });
    if (!file) {
      throw new AppError('File not found in this workspace.', 404);
    }

    // Remove local disk file if exists
    if (file.storageProvider === 'LOCAL' && file.metadataJson) {
      try {
        const meta = JSON.parse(file.metadataJson);
        if (meta.storedFileName) {
          const filePath = path.join(this.uploadsBaseDir, agencyId, meta.storedFileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        // Continue even if local delete fails
      }
    }

    await prisma.storageFile.delete({
      where: { id: fileId },
    });

    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action: 'ASSET_DELETED',
        entityType: 'ASSET',
        entityId: fileId,
        metadata: JSON.stringify({ fileName: file.fileName }),
      },
    });

    return { success: true };
  }
}
