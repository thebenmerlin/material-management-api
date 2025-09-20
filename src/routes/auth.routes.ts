import { Router } from 'express';
import bcrypt from 'bcrypt';
import { validate, loginSchema } from '../utils/validation';
import { UserModel } from '../models/user.model';
import { generateJwtForUser } from '../utils/jwt';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Find user by username OR email
    const user = await UserModel.findOne({
      where: username ? { username } : { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateJwtForUser(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;