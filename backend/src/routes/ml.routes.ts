import express from 'express';
import { MLController } from '../controllers/ml.controller';

const router = express.Router();

router.get('/demand-forecast', MLController.getDemandForecast);
router.get('/spend-forecast', MLController.getSpendForecast);
router.get('/supplier-reliability', MLController.getSupplierReliability);
router.get('/performance', MLController.getModelPerformance);

export { router as mlRoutes };
