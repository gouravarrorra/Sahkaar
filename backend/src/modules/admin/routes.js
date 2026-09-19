import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, forbidden, serverError } from '../../utils/response.js';
import { createAdminActionLog } from '../../utils/audit.js';

const router = Router();

// ─── ADMIN: Dashboard overview ───
router.get('/dashboard', authenticate, authorize('admin', 'reviewer', 'auditor'), communityGuard, async (req, res) => {
  try {
    const communityId = req.communityId;

    const [
      totalWorkers, pendingVerifications, activeBookings, completedBookings,
      pendingExceptions, unresolvedAlerts, openTickets, totalRevenue,
    ] = await Promise.all([
      prisma.worker.count({ where: { communityId } }),
      prisma.worker.count({ where: { communityId, verificationStatus: 'pending_verification' } }),
      prisma.booking.count({
        where: {
          communityId,
          status: { in: ['confirmed', 'on_the_way', 'arrived', 'in_progress'] },
        },
      }),
      prisma.booking.count({ where: { communityId, status: 'completed' } }),
      prisma.priceException.count({
        where: { communityId, status: { in: ['pending_review', 'under_review'] } },
      }),
      prisma.cartelAlert.count({ where: { communityId, status: 'flagged' } }),
      prisma.supportTicket.count({ where: { communityId, status: 'open' } }),
      prisma.booking.aggregate({
        where: { communityId, paymentStatus: 'paid' },
        _sum: { total: true },
      }),
    ]);

    return success(res, {
      totalWorkers,
      pendingVerifications,
      activeBookings,
      completedBookings,
      pendingExceptions,
      unresolvedAlerts,
      openTickets,
      totalRevenue: totalRevenue._sum.total || 0,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Community info ───
router.get('/community', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const community = await prisma.community.findUnique({
      where: { id: req.communityId },
    });
    if (!community) return notFound(res, 'Community');
    return success(res, community);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Update community ───
router.patch('/community', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const community = await prisma.community.update({
      where: { id: req.communityId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
      },
    });

    await createAdminActionLog({
      communityId: req.communityId,
      adminId: req.actor.id,
      action: 'Community Updated',
      category: 'community',
    });

    return success(res, community);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Suspend worker ───
router.patch('/workers/:id/suspend', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { reason } = req.body;
    const worker = await prisma.worker.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!worker) return notFound(res, 'Worker');

    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data: { accountStatus: 'suspended' },
    });

    await createAdminActionLog({
      communityId: req.communityId,
      adminId: req.actor.id,
      action: 'Worker Suspended',
      category: 'worker_management',
      previousValue: worker.accountStatus,
      newValue: 'suspended',
      reason: reason || '',
    });

    return success(res, { message: 'Worker suspended' });
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Reactivate worker ───
router.patch('/workers/:id/reactivate', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const worker = await prisma.worker.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!worker) return notFound(res, 'Worker');

    await prisma.worker.update({
      where: { id: worker.id },
      data: { accountStatus: 'active' },
    });

    await createAdminActionLog({
      communityId: req.communityId,
      adminId: req.actor.id,
      action: 'Worker Reactivated',
      category: 'worker_management',
      previousValue: 'suspended',
      newValue: 'active',
    });

    return success(res, { message: 'Worker reactivated' });
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
