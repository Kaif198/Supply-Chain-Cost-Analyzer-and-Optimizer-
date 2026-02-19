import { Request, Response } from 'express';
import { InventoryChainService } from '../services/inventory-chain.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InventoryChainController {

  static async recordMovement(req: Request, res: Response) {
    try {
      const { deliveryId, itemId, fromLocation, toLocation, quantity, movementType } = req.body;

      const result = await InventoryChainService.recordMovement({
        deliveryId,
        itemId,
        fromLocation,
        toLocation,
        quantity,
        movementType
      });

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to record movement on blockchain', details: result.error });
      }

      return res.json({ success: true, txHash: result.txHash });
    } catch (error) {
      console.error('Error in recordMovement:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const history = await InventoryChainService.getHistory(itemId);
      res.json(history);
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAuditLog(_req: Request, res: Response) {
    try {
      const logs = await prisma.inventoryChainRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return res.json(logs);
    } catch (error) {
      console.error('Error getting audit log:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAlerts(_req: Request, res: Response) {
    try {
      const alerts = await prisma.inventoryAlert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' }
      });
      res.json(alerts);
    } catch (error) {
      console.error('Error getting alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
