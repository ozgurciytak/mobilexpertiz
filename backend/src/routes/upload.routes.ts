import { Router } from 'express';
import { upload, uploadImages } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, upload.array('images', 10), uploadImages);

export default router;
