import { Router } from 'express';
import { createReview, getExpertReviews } from '../controllers/review.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// User routes
router.post('/', authenticate, authorizeRole(['USER']), createReview);

// Public/Common route to fetch reviews of an expert
router.get('/expert/:expertId', authenticate, getExpertReviews);

export default router;
