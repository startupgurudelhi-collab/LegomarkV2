import { Router } from 'express';
import { blogCommentController } from '../controllers/blog-comment.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => blogCommentController.getAdminComments(req, res));
router.patch('/:id/status', (req, res) => blogCommentController.updateStatus(req, res));
router.post('/:id/reply', (req, res) => blogCommentController.replyComment(req, res));
router.delete('/:id', (req, res) => blogCommentController.deleteComment(req, res));

export default router;
