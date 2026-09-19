import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { success, notFound, serverError } from '../../utils/response.js';

const router = Router();

// ─── Get user profile (self) ───
router.get('/me', authenticate, authorize('user'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.actor.id } });
    if (!user) return notFound(res, 'User');
    const { passwordHash, ...safe } = user;
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Update user profile ───
router.patch('/me', authenticate, authorize('user'), async (req, res) => {
  try {
    const { name, language, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.actor.id },
      data: {
        ...(name && { name }),
        ...(language && { language }),
        ...(avatar !== undefined && { avatar }),
      },
    });
    const { passwordHash, ...safe } = user;
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
