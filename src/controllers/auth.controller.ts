import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { DatabaseHelper } from '../utils/db';
import { generateToken } from '../middleware/auth.middleware';

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { username, password, site_code } = req.body;

            // Find user by username
            let user = DatabaseHelper.getOne(
                'SELECT u.*, s.site_code, s.site_name FROM users u LEFT JOIN sites s ON u.site_id = s.id WHERE u.username = ? AND u.is_active = 1',
                [username]
            );

            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // For Site Engineers, verify site_code if provided
            if (user.role === 'Site Engineer') {
                if (site_code && user.site_code !== site_code) {
                    res.status(401).json({ error: 'Invalid site code for this user' });
                    return;
                }
                if (!user.site_id) {
                    res.status(401).json({ error: 'Site Engineer must be assigned to a site' });
                    return;
                }
            }

            // Generate JWT token
            const token = generateToken(user.id);

            // Remove sensitive information
            const { password_hash, ...userInfo } = user;

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: userInfo.id,
                    username: userInfo.username,
                    role: userInfo.role,
                    full_name: userInfo.full_name,
                    email: userInfo.email,
                    site_id: userInfo.site_id,
                    site_code: userInfo.site_code,
                    site_name: userInfo.site_name
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            // This would be implemented if we had refresh token functionality
            // For now, client should re-login when token expires
            res.status(501).json({ error: 'Refresh token not implemented. Please login again.' });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async logout(req: Request, res: Response): Promise<void> {
        try {
            // Since we're using stateless JWT, logout is handled client-side
            // In a production app, you might maintain a blacklist of tokens
            res.json({ message: 'Logout successful' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
