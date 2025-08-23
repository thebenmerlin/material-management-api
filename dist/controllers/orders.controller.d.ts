import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class OrdersController {
    static createOrder(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateOrder(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getOrders(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getOrderById(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=orders.controller.d.ts.map