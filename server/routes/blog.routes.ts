import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';

const router = Router();

// Public blog routes (No auth required)
router.get('/', (req, res) => blogController.getPublicBlogs(req, res));
router.get('/:slug', (req, res) => blogController.getPublicBlogBySlug(req, res));

export default router;
