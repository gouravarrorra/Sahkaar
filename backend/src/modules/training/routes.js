import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, serverError } from '../../utils/response.js';

const router = Router();

// ─── ADMIN: List training programs ───
router.get('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({
      where: { communityId: req.communityId },
      include: { enrollments: { include: { worker: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, programs);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Create training program ───
router.post('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const data = req.body;
    const program = await prisma.trainingProgram.create({
      data: {
        communityId: req.communityId,
        name: data.name || '',
        organization: data.organization || '',
        skill: data.skill || '',
        eligibility: data.eligibility || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        location: data.location || '',
        capacity: data.capacity || 0,
        requiredDocs: JSON.stringify(data.requiredDocs || []),
        officialLink: data.officialLink || '',
        status: data.status || 'draft',
        createdBy: req.actor.id,
      },
    });
    return success(res, program, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Get published training programs ───
router.get('/available', authenticate, authorize('worker'), async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({
      where: { status: 'published' },
      orderBy: { startDate: 'asc' },
    });
    return success(res, programs);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Enroll in training ───
router.post('/:id/enroll', authenticate, authorize('worker'), async (req, res) => {
  try {
    const program = await prisma.trainingProgram.findUnique({ where: { id: req.params.id } });
    if (!program || program.status !== 'published') return notFound(res, 'Program');

    const existing = await prisma.trainingEnrollment.findFirst({
      where: { programId: program.id, workerId: req.actor.id },
    });
    if (existing) return error(res, 'Already enrolled');

    const enrollment = await prisma.trainingEnrollment.create({
      data: { programId: program.id, workerId: req.actor.id },
    });
    return success(res, enrollment, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Update enrollment status ───
router.patch('/enrollments/:id', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { status, certificateId } = req.body;
    const enrollment = await prisma.trainingEnrollment.findUnique({ where: { id: req.params.id } });
    if (!enrollment) return notFound(res, 'Enrollment');

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status,
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(certificateId && { certificateId }),
      },
    });
    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
