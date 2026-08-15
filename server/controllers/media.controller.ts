import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { SUB_DIRS } from '../utils/upload';

const UPLOAD_ROOT = config.uploadsDir;

export interface MediaAssetItem {
  id: string;
  name: string;
  url: string;
  category: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export class MediaController {
  /**
   * POST /api/admin/upload
   * Native file upload handler
   */
  async handleUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file was uploaded.',
        });
        return;
      }

      const file = req.file;
      const category = (req.query.category as string) || (req.body.category as string) || 'media';
      // URL accessible publicly via express static
      const publicUrl = `/uploads/${category}/${file.filename}`;

      logger.info(`File uploaded successfully: ${publicUrl} (${file.size} bytes)`, 'MediaController');

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: publicUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          category,
        },
      });
    } catch (error) {
      logger.error('File upload failed', 'MediaController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      });
    }
  }

  /**
   * GET /api/admin/media
   * List all uploaded files from disk
   */
  async listMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items: MediaAssetItem[] = [];
      const subDirs = ['founder', 'office', 'logos', 'testimonials', 'media'];

      for (const dir of subDirs) {
        const dirPath = path.join(UPLOAD_ROOT, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            if (file.startsWith('.')) continue;
            const filePath = path.join(dirPath, file);
            try {
              const stat = fs.statSync(filePath);
              if (stat.isFile()) {
                const ext = path.extname(file).toLowerCase();
                let mimeType = 'image/jpeg';
                if (ext === '.png') mimeType = 'image/png';
                else if (ext === '.webp') mimeType = 'image/webp';
                else if (ext === '.svg') mimeType = 'image/svg+xml';
                else if (ext === '.mp4') mimeType = 'video/mp4';
                else if (ext === '.webm') mimeType = 'video/webm';
                else if (ext === '.mov') mimeType = 'video/quicktime';

                items.push({
                  id: `${dir}_${file}`,
                  name: file,
                  url: `/uploads/${dir}/${file}`,
                  category: dir,
                  size: stat.size,
                  mimeType,
                  createdAt: stat.birthtime.toISOString(),
                });
              }
            } catch (err) {
              // Ignore single file stat error
            }
          }
        }
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      logger.error('Failed to list media files', 'MediaController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve media library assets',
      });
    }
  }

  /**
   * DELETE /api/admin/media
   * Delete uploaded file
   */
  async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
        res.status(400).json({
          success: false,
          error: 'Valid internal asset path is required.',
        });
        return;
      }

      const relativePath = url.replace(/^\/uploads\//, '');
      const safePath = path.resolve(UPLOAD_ROOT, relativePath);

      // Security check: ensure path stays within UPLOAD_ROOT
      if (!safePath.startsWith(UPLOAD_ROOT)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden path traversal.',
        });
        return;
      }

      if (fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
        logger.info(`Deleted file: ${safePath}`, 'MediaController');
      }

      res.status(200).json({
        success: true,
        message: 'File removed successfully',
      });
    } catch (error) {
      logger.error('Failed to delete media file', 'MediaController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
      });
    }
  }
}

export const mediaController = new MediaController();
