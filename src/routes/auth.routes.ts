import { Router } from 'express';
import bcrypt from 'bcrypt';
import { AuthController } from '../controllers/auth.controller';
import { validate, loginSchema } from '../utils/validation';
import { UserModel } from '../models/user.model'; // adjust path if needed
import { generateJwtForUser } from '../utils/jwt'; // adjust path if needed

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await UserModel.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password with stored hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateJwtForUser(user);

    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

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
