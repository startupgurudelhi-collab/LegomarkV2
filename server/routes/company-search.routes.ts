import { Router } from 'express';
import { companySearchController } from '../controllers/company-search.controller';

const router = Router();

// Public endpoint for MCA Rule 8 Company Name Search & Availability Check
// POST /api/company-search/check
router.post('/check', (req, res) => companySearchController.searchName(req, res));

export default router;
