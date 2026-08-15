import { Router } from 'express';
import { adminTestimonialController } from '../controllers/admin-testimonial.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect all admin testimonial routes with existing requireAuth middleware
router.use(requireAuth);

router.get('/', (req, res) => adminTestimonialController.getTestimonials(req, res));
router.get('/:id', (req, res) => adminTestimonialController.getTestimonialById(req, res));
router.post('/', (req, res) => adminTestimonialController.createTestimonial(req, res));
router.put('/:id', (req, res) => adminTestimonialController.updateTestimonial(req, res));
router.patch('/reorder', (req, res) => adminTestimonialController.reorderTestimonials(req, res));
router.delete('/:id', (req, res) => adminTestimonialController.deleteTestimonial(req, res));

export default router;
