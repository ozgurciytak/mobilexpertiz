import { Router } from 'express';
import { 
    createSupportRequest, 
    getSupportRequests, 
    updateSupportStatus, 
    getSupportRequestDetail, 
    addSupportMessage 
} from '../controllers/support.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createSupportRequest);
router.get('/', authenticate, getSupportRequests);
router.get('/:id', authenticate, getSupportRequestDetail);
router.post('/:id/messages', authenticate, addSupportMessage);
router.put('/:id/status', authenticate, authorizeRole(['ADMIN']), updateSupportStatus);

export default router;
