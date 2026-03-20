import { Router } from 'express';
import { createRequest, getMyRequests, getAvailableRequests, getAllRequestsAdmin, getRequestDetail, redirectRequest } from '../controllers/request.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// User routes
router.post('/', authenticate, authorizeRole(['USER']), createRequest);
// List routes (Specific first)
router.get('/my', authenticate, getMyRequests);
router.get('/pool', authenticate, authorizeRole(['EXPERT']), getAvailableRequests);
router.get('/', authenticate, authorizeRole(['ADMIN']), getAllRequestsAdmin);

// Detail routes (Parametric second)
router.get('/:id', authenticate, getRequestDetail);
router.put('/:id/redirect', authenticate, authorizeRole(['EXPERT']), redirectRequest);

export default router;
