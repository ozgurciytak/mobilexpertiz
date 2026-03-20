import { Router } from 'express';
import { submitQuote, getRequestQuotes, acceptQuote } from '../controllers/quote.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Expert routes
router.post('/', authenticate, authorizeRole(['EXPERT']), submitQuote);

// User routes (getting quotes for their specific request, accepting quote)
router.get('/request/:id', authenticate, getRequestQuotes);
router.put('/:quoteId/accept', authenticate, authorizeRole(['USER']), acceptQuote);

export default router;
