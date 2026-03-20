import { Router } from 'express';
import { 
    getAllRecords, 
    blockUser, 
    deleteUser, 
    editUser, 
    exportRecordsPDF, 
    getUserPDF, 
    getRequestPDF, 
    renewExpertSubscription, 
    searchVehicle,
    getSystemSettings,
    updateSystemSetting,
    getAdminPayments,
    approvePayment
} from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRole(['ADMIN']));

router.get('/records', getAllRecords);
router.get('/records/export', exportRecordsPDF);
router.get('/vehicles/search', searchVehicle);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/edit', editUser);
router.delete('/users/:id', deleteUser);
router.put('/experts/:id/renew', renewExpertSubscription);

router.get('/users/:id/pdf', getUserPDF);
router.get('/requests/:id/pdf', getRequestPDF);

// Financial & System Settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);
router.get('/payments', getAdminPayments);
router.put('/payments/:id/approve', approvePayment);

export default router;
