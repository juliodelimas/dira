import { Router } from 'express';
import { getMe } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/users/me', authenticate, getMe);

export default router;
