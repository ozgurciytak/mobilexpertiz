import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile, savePushToken, getAllUsers, approveExpert, updateSubscription } from '../controllers/user.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Common: get profile & push token
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/profile', authenticate, deleteProfile);
router.post('/push-token', authenticate, savePushToken);

// Admin routes
router.get('/', authenticate, authorizeRole(['ADMIN']), getAllUsers);
router.put('/:id/approve', authenticate, authorizeRole(['ADMIN']), approveExpert);
router.put('/:id/subscription', authenticate, authorizeRole(['ADMIN', 'EXPERT']), updateSubscription);

export default router;
