import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, forbidden, serverError } from '../../utils/response.js';

const router = Router();

// ─── GET audit trail (community-scoped, read-only) ───
router.get('/', authenticate, authorize('admin', 'auditor'), communityGuard, async (req, res) => {
  try {
    const { entityType, entityId, limit } = req.query;
    const where = { communityId: req.communityId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 100,
    });
    return success(res, logs);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── GET admin action log ───
router.get('/admin-actions', authenticate, authorize('admin', 'auditor'), communityGuard, async (req, res) => {
  try {
    const { adminId, category, limit } = req.query;
    const where = { communityId: req.communityId };
    if (adminId) where.adminId = adminId;
    if (category) where.category = category;

    const logs = await prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 100,
    });
    return success(res, logs);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── IMPORTANT: No DELETE or PUT endpoints ───
// Audit records are immutable. Normal admin APIs cannot delete or modify them.
// Any attempt to delete returns 403.
router.delete('/:id', authenticate, (req, res) => {
  return forbidden(res, 'Audit records are immutable and cannot be deleted');
});

router.put('/:id', authenticate, (req, res) => {
  return forbidden(res, 'Audit records are immutable and cannot be modified');
});

export default router;
