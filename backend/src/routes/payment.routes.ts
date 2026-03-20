import { Router } from 'express';
import { getExpertSubscriptionStatus, initiatePayment, getMyPayments } from '../controllers/payment.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/status', authorizeRole(['EXPERT']), getExpertSubscriptionStatus);
router.post('/initiate', authorizeRole(['EXPERT']), initiatePayment);
router.get('/my-payments', authorizeRole(['EXPERT']), getMyPayments);

export default router;
