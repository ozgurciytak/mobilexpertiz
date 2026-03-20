import { Router } from 'express';
import { getProfile, getAllUsers, approveExpert, updateSubscription } from '../controllers/user.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Common: get profile
router.get('/profile', authenticate, getProfile);

// Admin routes
router.get('/', authenticate, authorizeRole(['ADMIN']), getAllUsers);
router.put('/:id/approve', authenticate, authorizeRole(['ADMIN']), approveExpert);
router.put('/:id/subscription', authenticate, authorizeRole(['ADMIN', 'EXPERT']), updateSubscription);

export default router;
