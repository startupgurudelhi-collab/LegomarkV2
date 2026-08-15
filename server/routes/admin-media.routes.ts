import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { requireAuth } from '../middleware/auth';
import { uploadMiddleware } from '../utils/upload';

const router = Router();

// Protect all media endpoints with existing requireAuth middleware
router.post('/upload', requireAuth, uploadMiddleware.single('file'), (req, res, next) => {
  mediaController.handleUpload(req, res, next);
});

router.get('/media', requireAuth, (req, res, next) => {
  mediaController.listMedia(req, res, next);
});

router.delete('/media', requireAuth, (req, res, next) => {
  mediaController.deleteMedia(req, res, next);
});

export default router;
