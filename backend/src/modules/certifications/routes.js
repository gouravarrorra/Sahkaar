import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, serverError } from '../../utils/response.js';
import { createAuditLog } from '../../utils/audit.js';
import { createNotification } from '../notifications/routes.js';

const router = Router();

// ─── ADMIN: List certifications (community-scoped) ───
router.get('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const certs = await prisma.certification.findMany({
      where: { worker: { communityId: req.communityId } },
      include: {
        worker: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, certs);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Get my certifications ───
router.get('/mine', authenticate, authorize('worker'), async (req, res) => {
  try {
    const certs = await prisma.certification.findMany({
      where: { workerId: req.actor.id },
      include: { service: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, certs);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Request certification ───
router.post('/request', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { serviceId, type } = req.body;
    if (!serviceId) return error(res, 'serviceId required');

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return notFound(res, 'Service');

    // Check if already has active certification
    const existing = await prisma.certification.findFirst({
      where: {
        workerId: req.actor.id,
        serviceId,
        status: { in: ['requested', 'scheduled', 'assessed', 'passed', 'issued'] },
      },
    });
    if (existing) return error(res, 'Certification already requested or active');

    const cert = await prisma.certification.create({
      data: {
        workerId: req.actor.id,
        serviceId,
        type: type || 'platform',
        status: 'requested',
      },
    });

    return success(res, cert, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Update certification status (assessment workflow) ───
router.patch('/:id/status', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { status, assessmentNotes, certificateNo } = req.body;
    const validStatuses = ['scheduled', 'assessed', 'passed', 'failed', 'issued', 'expired'];
    if (!validStatuses.includes(status)) return error(res, 'Invalid status');

    const cert = await prisma.certification.findFirst({
      where: { id: req.params.id, worker: { communityId: req.communityId } },
    });
    if (!cert) return notFound(res, 'Certification');

    // Worker cannot approve their own certification (enforced: admin is doing it)
    const updateData = {
      status,
      ...(assessmentNotes && { assessmentNotes }),
      ...(status === 'assessed' && { assessedBy: req.actor.id, assessmentDate: new Date() }),
      ...(status === 'issued' && { certificateNo, issuedAt: new Date() }),
    };

    const updated = await prisma.certification.update({
      where: { id: cert.id },
      data: updateData,
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'CERTIFICATION_STATUS_UPDATE',
      entityType: 'certification',
      entityId: cert.id,
      previousValue: cert.status,
      newValue: status,
      reason: assessmentNotes || '',
    });

    // Notify the worker
    createNotification({
      workerId: cert.workerId,
      type: 'certification',
      title: 'Certification Update',
      body: `Your certification status has been updated to: ${status}.`,
      communityId: req.communityId,
    }).catch(() => {});

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
