import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, serverError } from '../../utils/response.js';

const router = Router();

// ─── Workforce analytics (aggregated, no personal info exposure) ───
router.get('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const communityId = req.communityId;

    // Workers by verification status
    const workersByStatus = await prisma.worker.groupBy({
      by: ['verificationStatus'],
      where: { communityId },
      _count: true,
    });

    // Workers by skill
    const workerSkills = await prisma.workerSkill.findMany({
      where: { worker: { communityId } },
      include: { service: { select: { id: true, name: true } } },
    });
    const skillCounts = {};
    for (const ws of workerSkills) {
      const key = ws.service.name;
      skillCounts[key] = (skillCounts[key] || 0) + 1;
    }

    // Certification stats
    const certStats = await prisma.certification.groupBy({
      by: ['status'],
      where: { worker: { communityId } },
      _count: true,
    });

    // Booking volume
    const totalBookings = await prisma.booking.count({ where: { communityId } });
    const completedBookings = await prisma.booking.count({ where: { communityId, status: 'completed' } });
    const activeBookings = await prisma.booking.count({
      where: {
        communityId,
        status: { in: ['confirmed', 'on_the_way', 'arrived', 'in_progress', 'worker_done'] },
      },
    });

    // Service demand (bookings per service)
    const serviceDemand = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: { communityId },
      _count: true,
    });

    // Total workers
    const totalWorkers = await prisma.worker.count({ where: { communityId } });
    const verifiedWorkers = await prisma.worker.count({ where: { communityId, verificationStatus: 'approved' } });

    return success(res, {
      totalWorkers,
      verifiedWorkers,
      unverifiedWorkers: totalWorkers - verifiedWorkers,
      workersByStatus: workersByStatus.map(w => ({ status: w.verificationStatus, count: w._count })),
      skillDistribution: Object.entries(skillCounts).map(([skill, count]) => ({ skill, count })),
      certificationStats: certStats.map(c => ({ status: c.status, count: c._count })),
      bookingStats: {
        total: totalBookings,
        completed: completedBookings,
        active: activeBookings,
      },
      serviceDemand: serviceDemand.map(s => ({ serviceId: s.serviceId, count: s._count })),
    });
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
