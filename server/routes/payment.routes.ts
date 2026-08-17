import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

// GET /api/payment/config
router.get('/config', (req, res) => paymentController.getConfig(req, res));

// POST /api/payment/create-order
router.post('/create-order', (req, res) => paymentController.createOrder(req, res));

// POST /api/payment/verify
router.post('/verify', (req, res) => paymentController.verifyPayment(req, res));

export default router;
