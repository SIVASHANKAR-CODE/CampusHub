import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { chat } from '../controllers/aiController.js';

const router = Router();
router.use(authenticate);
router.post('/chat', aiLimiter, chat);

export default router;
