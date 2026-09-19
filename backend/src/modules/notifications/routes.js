import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate } from '../../middleware/auth.js';
import { success, serverError } from '../../utils/response.js';

const router = Router();

// ─── Get notifications for current actor ───
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.actor.role === 'user') where.userId = req.actor.id;
    else if (req.actor.role === 'worker') where.workerId = req.actor.id;
    else if (['admin', 'reviewer', 'auditor'].includes(req.actor.role)) where.adminId = req.actor.id;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return success(res, notifications);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Mark as read ───
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    return success(res, notification);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Mark all read ───
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const where = { read: false };
    if (req.actor.role === 'user') where.userId = req.actor.id;
    else if (req.actor.role === 'worker') where.workerId = req.actor.id;
    else where.adminId = req.actor.id;

    await prisma.notification.updateMany({
      where,
      data: { read: true },
    });
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Utility: Create notification (used by other modules) ───
export async function createNotification({ userId, workerId, adminId, communityId, type, title, body }) {
  return prisma.notification.create({
    data: { userId, workerId, adminId, communityId, type, title, body },
  });
}

export default router;
