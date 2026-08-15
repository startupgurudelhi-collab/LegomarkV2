import { Router } from 'express';
import { adminLeadController } from '../controllers/admin-lead.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin lead endpoints with authentication and role check
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/leads - Fetch all filtered/paginated leads
router.get('/', (req, res) => adminLeadController.getLeads(req, res));

// GET /api/admin/leads/stats - Fetch aggregate counts
router.get('/stats', (req, res) => adminLeadController.getStats(req, res));

// GET /api/admin/leads/:id - Fetch single lead
router.get('/:id', (req, res) => adminLeadController.getLeadById(req, res));

// PATCH /api/admin/leads/:id/status - Update lead status
router.patch('/:id/status', (req, res) => adminLeadController.updateLeadStatus(req, res));

// PATCH /api/admin/leads/:id/notes - Update admin notes
router.patch('/:id/notes', (req, res) => adminLeadController.updateLeadNotes(req, res));

// DELETE /api/admin/leads/:id - Delete lead record
router.delete('/:id', (req, res) => adminLeadController.deleteLead(req, res));

export default router;
