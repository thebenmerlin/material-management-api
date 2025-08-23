import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class MaterialsController {
    static getMaterials(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMaterialById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getCategories(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=materials.controller.d.ts.map