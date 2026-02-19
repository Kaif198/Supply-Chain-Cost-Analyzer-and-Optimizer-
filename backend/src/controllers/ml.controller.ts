import { Request, Response } from 'express';
import axios from 'axios';

// Default to local python service port if not set
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:10000';

export class MLController {
    static async getDemandForecast(req: Request, res: Response) {
        try {
            const { days } = req.query;
            const response = await axios.post(`${ML_SERVICE_URL}/forecast/demand`, {
                days: Number(days) || 30
            });
            res.json(response.data);
        } catch (error: any) {
            console.error('ML Service Error:', error.message);
            res.status(503).json({
                error: 'Forecasting service unavailable',
                details: error.response?.data || error.message
            });
        }
    }

    static async getSpendForecast(req: Request, res: Response) {
        try {
            const { days } = req.query;
            const response = await axios.post(`${ML_SERVICE_URL}/forecast/spend`, {
                days: Number(days) || 30
            });
            res.json(response.data);
        } catch (error: any) {
            console.error('ML Service Error:', error.message);
            res.status(503).json({
                error: 'Forecasting service unavailable',
                details: error.response?.data || error.message
            });
        }
    }

    static async getSupplierReliability(req: Request, res: Response) {
        try {
            // Forward the dashboard request to the specific endpoint
            const response = await axios.get(`${ML_SERVICE_URL}/predict/dashboard-reliability`);
            res.json(response.data);
        } catch (error: any) {
            console.error('ML Service Error:', error.message);
            res.status(503).json({
                error: 'Forecasting service unavailable',
                details: error.response?.data || error.message
            });
        }
    }

    static async getModelPerformance(req: Request, res: Response) {
        try {
            const response = await axios.get(`${ML_SERVICE_URL}/model/performance`);
            res.json(response.data);
        } catch (error: any) {
            res.status(503).json({ error: 'Forecasting service unavailable' });
        }
    }
}
