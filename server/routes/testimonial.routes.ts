import { Router } from 'express';
import { testimonialController } from '../controllers/testimonial.controller';

const router = Router();

// Public endpoint to fetch published testimonials
router.get('/', (req, res) => testimonialController.getPublicTestimonials(req, res));

export default router;
