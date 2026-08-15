import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '../config/env';

// Authoritative upload directory: configurable via UPLOADS_DIR (for persistent volume mounting)
export const UPLOAD_DIR = config.uploadsDir;

// Subdirectories for categorization
export const SUB_DIRS = ['founder', 'office', 'logos', 'testimonials', 'media'] as const;
export type UploadCategory = typeof SUB_DIRS[number];

// Ensure upload directory and subcategories exist recursively
export function ensureUploadDirectoriesExist(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  SUB_DIRS.forEach((dir) => {
    const subPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
    }
  });
}

// Initialize on module load
ensureUploadDirectoriesExist();

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determine category based on query or route params
    const category = ((req.query.category as string) || (req.body.category as string) || 'media') as UploadCategory;
    const targetDir = (SUB_DIRS as readonly string[]).includes(category)
      ? path.join(UPLOAD_DIR, category)
      : path.join(UPLOAD_DIR, 'media');

    cb(null, targetDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Sanitize original name and generate unique timestamp prefix
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  },
});

// File validation filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed formats: JPG, PNG, WEBP, SVG, GIF, MP4, WEBM, MOV.`
      )
    );
  }
};

// 50MB file size limit for video, images are naturally smaller
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file limit
  },
});
