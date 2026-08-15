import { Router } from 'express';
import { adminBlogController } from '../controllers/admin-blog.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect all admin blog routes with frozen requireAuth middleware
router.use(requireAuth);

router.get('/', (req, res) => adminBlogController.getBlogs(req, res));
router.get('/:id', (req, res) => adminBlogController.getBlogById(req, res));
router.post('/', (req, res) => adminBlogController.createBlog(req, res));
router.put('/:id', (req, res) => adminBlogController.updateBlog(req, res));
router.patch('/:id/toggle-publish', (req, res) => adminBlogController.togglePublish(req, res));
router.delete('/:id', (req, res) => adminBlogController.deleteBlog(req, res));

export default router;
