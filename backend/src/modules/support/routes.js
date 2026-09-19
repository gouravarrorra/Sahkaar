import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, serverError } from '../../utils/response.js';

const router = Router();

// ─── Create ticket (user or worker) ───
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookingId, category, description, priority } = req.body;

    const data = {
      category: category || 'general',
      description: description || '',
      priority: priority || 'medium',
      bookingId: bookingId || null,
    };

    if (req.actor.role === 'user') {
      data.userId = req.actor.id;
    } else if (req.actor.role === 'worker') {
      data.workerId = req.actor.id;
      const worker = await prisma.worker.findUnique({ where: { id: req.actor.id } });
      data.communityId = worker?.communityId;
    }

    const ticket = await prisma.supportTicket.create({ data });
    return success(res, ticket, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── User/Worker: Get own tickets ───
router.get('/mine', authenticate, async (req, res) => {
  try {
    const where = req.actor.role === 'user'
      ? { userId: req.actor.id }
      : req.actor.role === 'worker'
        ? { workerId: req.actor.id }
        : {};

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return success(res, tickets);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Get community tickets ───
router.get('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { communityId: req.communityId },
      include: {
        user: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, tickets);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Update ticket status ───
router.patch('/:id', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { status, resolution, assignedTo, priority } = req.body;
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!ticket) return notFound(res, 'Ticket');

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        ...(status && { status }),
        ...(resolution !== undefined && { resolution }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(priority && { priority }),
      },
    });
    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
