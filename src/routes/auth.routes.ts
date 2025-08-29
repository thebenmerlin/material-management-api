import { Router } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model'; // adjust path if needed
import { validate, loginSchema } from '../utils/validation';
import { generateJwtForUser, verifyRefreshToken } from '../utils/jwt'; // adjust path if needed

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token + refresh token
 * @access Public
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await UserModel.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate access + refresh tokens
    const { accessToken, refreshToken } = generateJwtForUser(user);

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT access token using refresh token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Re-issue a new access token
    const { accessToken } = generateJwtForUser(payload);

    return res.json({ success: true, accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client removes tokens; optional server blacklist)
 * @access Public
 */
router.post('/logout', (req, res) => {
  // For stateless JWTs: client just deletes tokens.
  // If you want server-side invalidation, store refresh tokens in DB/Redis and delete here.
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
