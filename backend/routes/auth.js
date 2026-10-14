import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
