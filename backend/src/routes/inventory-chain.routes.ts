import { Router } from 'express';
import { InventoryChainController } from '../controllers/inventory-chain.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/record-movement', authenticate, InventoryChainController.recordMovement);
router.get('/history/:itemId', authenticate, InventoryChainController.getHistory);
router.get('/audit-log', authenticate, InventoryChainController.getAuditLog);
router.get('/alerts', authenticate, InventoryChainController.getAlerts);

export default router;
