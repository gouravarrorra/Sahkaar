import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { success, error, notFound, forbidden, serverError } from '../../utils/response.js';
import { createAuditLog } from '../../utils/audit.js';

const router = Router();

// ─── Worker profile (self) ───
router.get('/me', authenticate, authorize('worker'), async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.actor.id },
      include: {
        skills: { include: { service: true } },
        availability: true,
        certifications: true,
        insuranceEnrollments: { include: { plan: true } },
      },
    });
    if (!worker) return notFound(res, 'Worker');
    // Remove password hash from response
    const { passwordHash, ...safe } = worker;
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Update profile (self) ───
router.patch('/me', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { name, email, baseLocation, serviceRadius, avatar } = req.body;
    const worker = await prisma.worker.update({
      where: { id: req.actor.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(baseLocation !== undefined && { baseLocation }),
        ...(serviceRadius !== undefined && { serviceRadius }),
        ...(avatar !== undefined && { avatar }),
      },
    });
    const { passwordHash, ...safe } = worker;
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Update availability ───
router.put('/me/availability', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { availability } = req.body; // { monday: { start, end, isOff }, ... }
    if (!availability || typeof availability !== 'object') {
      return error(res, 'Availability data required');
    }

    const workerId = req.actor.id;
    const results = [];

    for (const [day, schedule] of Object.entries(availability)) {
      const result = await prisma.workerAvailability.upsert({
        where: { workerId_dayOfWeek: { workerId, dayOfWeek: day } },
        update: {
          startTime: schedule.start || schedule.startTime || '09:00',
          endTime: schedule.end || schedule.endTime || '18:00',
          isOff: schedule.off || schedule.isOff || false,
        },
        create: {
          workerId,
          dayOfWeek: day,
          startTime: schedule.start || schedule.startTime || '09:00',
          endTime: schedule.end || schedule.endTime || '18:00',
          isOff: schedule.off || schedule.isOff || false,
        },
      });
      results.push(result);
    }

    return success(res, results);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Worker's own proposals (cannot see others') ───
router.get('/me/proposals', authenticate, authorize('worker'), async (req, res) => {
  try {
    const proposals = await prisma.priceProposal.findMany({
      where: { workerId: req.actor.id },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, proposals);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: List workers in their community ───
router.get('/', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { communityId: req.communityId },
      include: {
        skills: { include: { service: true } },
        certifications: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Strip password hashes
    const safe = workers.map(({ passwordHash, ...w }) => w);
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Get single worker ───
router.get('/:id', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const worker = await prisma.worker.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
      include: {
        skills: { include: { service: true } },
        availability: true,
        certifications: true,
        insuranceEnrollments: { include: { plan: true } },
      },
    });
    if (!worker) return notFound(res, 'Worker');
    const { passwordHash, ...safe } = worker;
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Update verification status ───
const verifySchema = z.object({
  verificationStatus: z.enum(['approved', 'rejected', 'pending_verification', 'admin_review']),
  reason: z.string().optional().default(''),
});

router.patch('/:id/verify', authenticate, authorize('admin'), communityGuard, validate(verifySchema), async (req, res) => {
  try {
    const { verificationStatus, reason } = req.validated;
    const workerId = req.params.id;

    // Ensure worker belongs to admin's community
    const worker = await prisma.worker.findFirst({
      where: { id: workerId, communityId: req.communityId },
    });
    if (!worker) return notFound(res, 'Worker');

    const updated = await prisma.worker.update({
      where: { id: workerId },
      data: { verificationStatus },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'WORKER_VERIFICATION_UPDATE',
      entityType: 'worker',
      entityId: workerId,
      previousValue: worker.verificationStatus,
      newValue: verificationStatus,
      reason,
    });

    const { passwordHash, ...safe } = updated;
    return success(res, safe);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
