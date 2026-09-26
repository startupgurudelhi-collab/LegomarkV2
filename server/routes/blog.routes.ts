import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { blogCommentController } from '../controllers/blog-comment.controller';

const router = Router();

// Public blog routes (No auth required)
router.get('/', (req, res) => blogController.getPublicBlogs(req, res));
router.get('/:slug', (req, res) => blogController.getPublicBlogBySlug(req, res));

// Public blog comments routes (No auth required; pending comments never shown)
router.get('/:slug/comments', (req, res) => blogCommentController.getApprovedComments(req, res));
router.post('/:slug/comments', (req, res) => blogCommentController.createPublicComment(req, res));

export default router;
