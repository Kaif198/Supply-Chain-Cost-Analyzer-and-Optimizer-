import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { securityHeaders, corsMiddleware, rateLimiter, sanitizeInput } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logging';
import { AuthController } from './controllers/AuthController';
import { DeliveryController } from './controllers/DeliveryController';
import { RouteController } from './controllers/RouteController';
import { PremiseController } from './controllers/PremiseController';
import { VehicleController } from './controllers/VehicleController';
import { AnalyticsController } from './controllers/AnalyticsController';
import inventoryChainRoutes from './routes/inventory-chain.routes';
import { mlRoutes } from './routes/ml.routes';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json());
app.use(sanitizeInput);

// Request logging middleware
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Swagger API documentation
/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 *   - name: Deliveries
 *     description: Delivery cost calculation and management
 *   - name: Routes
 *     description: Multi-stop route optimization
 *   - name: Premises
 *     description: Premise (delivery location) management
 *   - name: Vehicles
 *     description: Vehicle fleet management
 *   - name: Analytics
 *     description: KPIs, trends, and operational metrics
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Red Bull Supply Chain API Docs',
}));

// Health check endpoints (no rate limiting)
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (_req: express.Request, res: express.Response) => {
  // Check if services are ready (database, redis, etc.)
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/logout', authenticate, AuthController.logout);
app.get('/api/auth/me', authenticate, AuthController.me);

// Delivery routes
app.post('/api/deliveries/calculate', authenticate, DeliveryController.calculate);
app.get('/api/deliveries', authenticate, DeliveryController.list);
app.post('/api/deliveries', authenticate, DeliveryController.create);

// Route routes
app.post('/api/routes/optimize', authenticate, RouteController.optimize);
app.get('/api/routes/:id', authenticate, RouteController.getById);
app.post('/api/routes', authenticate, RouteController.create);

// Premise routes
app.get('/api/premises', authenticate, PremiseController.list);
app.get('/api/premises/:id', authenticate, PremiseController.getById);
app.post('/api/premises', authenticate, PremiseController.create);
app.put('/api/premises/:id', authenticate, PremiseController.update);
app.delete('/api/premises/:id', authenticate, PremiseController.delete);

// Vehicle routes
app.get('/api/vehicles', authenticate, VehicleController.list);
app.get('/api/vehicles/:id', authenticate, VehicleController.getById);
app.put('/api/vehicles/:id', authenticate, VehicleController.update);

// Analytics routes
app.get('/api/analytics/kpis', authenticate, AnalyticsController.getKPIs);
app.get('/api/analytics/cost-trends', authenticate, AnalyticsController.getCostTrends);
app.get('/api/analytics/fleet-utilization', authenticate, AnalyticsController.getFleetUtilization);
app.get('/api/analytics/top-routes', authenticate, AnalyticsController.getTopRoutes);
app.get('/api/analytics/top-premises', authenticate, AnalyticsController.getTopPremises);
app.post('/api/analytics/export', authenticate, AnalyticsController.export);

// Inventory Chain routes
app.use('/api/inventory-chain', inventoryChainRoutes);

// ML routes
app.use('/api/ml', mlRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize Blockchain Service
  // Using the hardcoded values from the service file for this local demo
  import('./services/inventory-chain.service').then(({ InventoryChainService }) => {
    InventoryChainService.initialize();
  });
});

export default app;
