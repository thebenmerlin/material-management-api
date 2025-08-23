import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, loginSchema } from '../utils/validation';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 * @access Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Public
 */
router.post('/logout', AuthController.logout);

export default router;
