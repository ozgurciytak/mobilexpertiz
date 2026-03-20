import { Router } from 'express';
import { createReport, updateReport, getReport, getReportPDF } from '../controllers/report.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Expert routes
router.post('/', authenticate, authorizeRole(['EXPERT']), createReport);
router.put('/:id', authenticate, authorizeRole(['EXPERT']), updateReport);

// Common route to fetch report by Request Id
router.get('/request/:requestId', authenticate, getReport);
router.get('/request/:requestId/pdf', authenticate, getReportPDF);

export default router;
