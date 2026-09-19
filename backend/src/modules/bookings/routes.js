import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { success, error, notFound, forbidden, serverError } from '../../utils/response.js';
import { createAuditLog } from '../../utils/audit.js';
import { genId, isValidTransition } from '../../utils/helpers.js';
import { createNotification } from '../notifications/routes.js';

const router = Router();

// ─── Schemas ───

const createRequestSchema = z.object({
  service: z.string().min(1),
  subType: z.string().optional().default(''),
  description: z.string().min(1),
  photo: z.string().optional().nullable(),
  date: z.string().min(1),
  time: z.string().min(1),
  locationType: z.enum(['gps', 'manual']).default('manual'),
  locationDisplay: z.string().optional().default(''),
  house: z.string().optional().default(''),
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  pin: z.string().optional().default(''),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

// ─── USER: Create service request ───

router.post('/', authenticate, authorize('user'), validate(createRequestSchema), async (req, res) => {
  try {
    const data = req.validated;
    const userId = req.actor.id;

    // Validate service exists
    const service = await prisma.service.findUnique({ where: { id: data.service } });
    if (!service) return error(res, 'Invalid service category');

    const bookingId = genId('B');

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          id: bookingId,
          userId,
          serviceId: data.service,
          subType: data.subType,
          description: data.description,
          photo: data.photo,
          date: data.date,
          time: data.time,
          locationType: data.locationType,
          locationDisplay: data.locationDisplay,
          locationHouse: data.house,
          locationStreet: data.street,
          locationCity: data.city,
          locationState: data.state,
          locationPin: data.pin,
          locationLat: data.lat,
          locationLng: data.lng,
          status: 'requested',
        },
      });

      // Record initial status
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: b.id,
          toStatus: 'requested',
          changedBy: userId,
          changedByRole: 'user',
        },
      });

      return b;
    });

    // Notify eligible workers about new request
    const eligibleWorkers = await prisma.workerSkill.findMany({
      where: { serviceId: data.service },
      include: { worker: { select: { id: true, verificationStatus: true, accountStatus: true } } },
    });
    for (const ws of eligibleWorkers) {
      if (ws.worker.verificationStatus === 'approved' && ws.worker.accountStatus === 'active') {
        createNotification({
          workerId: ws.worker.id,
          type: 'booking',
          title: 'New Service Request',
          body: `New ${service.name} request available near you.`,
        }).catch(() => {});
      }
    }

    return success(res, booking, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── USER: Get eligible workers for a booking ───

router.get('/:id/eligible-workers', authenticate, authorize('user'), async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.actor.id },
    });
    if (!booking) return notFound(res, 'Booking');

    // Find workers with matching skill, verified, and active
    const workers = await prisma.worker.findMany({
      where: {
        verificationStatus: 'approved',
        accountStatus: 'active',
        skills: {
          some: { serviceId: booking.serviceId },
        },
      },
      include: {
        skills: { include: { service: true } },
        certifications: { where: { serviceId: booking.serviceId } },
        availability: true,
      },
    });

    // Filter by availability for the booking day
    const bookingDay = new Date(booking.date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const eligible = workers
      .filter((w) => {
        const dayAvail = w.availability.find((a) => a.dayOfWeek === bookingDay);
        if (!dayAvail || dayAvail.isOff) return false;
        // Check if booking time is within availability
        if (booking.time < dayAvail.startTime || booking.time > dayAvail.endTime) return false;
        return true;
      })
      .map(({ passwordHash, ...w }) => ({
        ...w,
        distance: +(1.5 + Math.random() * 6).toFixed(1), // Placeholder until real distance calc
      }));

    return success(res, eligible);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── USER: Select a worker ───

router.post('/:id/select-worker', authenticate, authorize('user'), async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return error(res, 'workerId required');

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.actor.id },
    });
    if (!booking) return notFound(res, 'Booking');

    // Only allow selection from requested/workers_accepting states
    if (!['requested', 'workers_notified', 'workers_accepting'].includes(booking.status)) {
      return error(res, `Cannot select worker in status: ${booking.status}`);
    }

    // Verify worker is approved and active
    const worker = await prisma.worker.findFirst({
      where: {
        id: workerId,
        verificationStatus: 'approved',
        accountStatus: 'active',
      },
    });
    if (!worker) return error(res, 'Worker not available or not verified');

    // Use transaction to prevent race condition — one booking, one final worker
    const updated = await prisma.$transaction(async (tx) => {
      // Re-check booking status inside transaction
      const current = await tx.booking.findUnique({ where: { id: booking.id } });
      if (current.workerId && current.workerId !== workerId) {
        throw new Error('Another worker already selected');
      }

      const b = await tx.booking.update({
        where: { id: booking.id },
        data: { workerId, status: 'worker_selected' },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: 'worker_selected',
          changedBy: req.actor.id,
          changedByRole: 'user',
        },
      });

      return b;
    });

    // Notify the selected worker
    createNotification({
      workerId,
      type: 'booking',
      title: 'You Have Been Selected',
      body: `You have been selected for booking ${booking.id}. Please confirm.`,
    }).catch(() => {});

    return success(res, updated);
  } catch (err) {
    if (err.message === 'Another worker already selected') {
      return error(res, err.message, 409);
    }
    return serverError(res, err);
  }
});

// ─── Confirm booking (locks governed price) ───

router.post('/:id/confirm', authenticate, authorize('user', 'worker', 'admin'), async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return notFound(res, 'Booking');

    if (booking.status !== 'worker_selected') {
      return error(res, `Cannot confirm from status: ${booking.status}`);
    }

    // Get the governed price — NEVER trust frontend
    const priceBand = await prisma.priceBand.findFirst({
      where: { serviceId: booking.serviceId },
    });
    const serviceCharge = priceBand ? priceBand.reference : 250; // Governed reference price

    // Get the worker to set communityId on booking
    const worker = await prisma.worker.findUnique({ where: { id: booking.workerId } });
    const communityId = worker?.communityId || null;

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          communityId,
          serviceCharge,
          priceLockedAt: new Date(),
          priceSource: 'SAHKAAR_GOVERNED',
          priceBandVersion: priceBand?.version || null,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: 'confirmed',
          changedBy: req.actor.id,
          changedByRole: req.actor.role,
        },
      });

      // Create travel calculation record if distance is known
      if (booking.travelDistance && booking.travelDistance > 0) {
        const travelConfig = await tx.travelConfig.findFirst({
          where: { communityId: communityId || undefined },
          orderBy: { createdAt: 'desc' },
        });
        const ratePerKm = travelConfig?.ratePerKm || 18;
        const calculatedAmount = Math.round(booking.travelDistance * ratePerKm);

        await tx.travelCalculation.create({
          data: {
            bookingId: booking.id,
            distance: booking.travelDistance,
            ratePerKm,
            calculatedAmount,
            rateSource: travelConfig ? 'community_config' : 'default',
          },
        }).catch(() => {});

        await tx.booking.update({
          where: { id: booking.id },
          data: { travelCost: calculatedAmount },
        });
      }

      return b;
    });

    // Notify both parties
    createNotification({
      userId: booking.userId,
      type: 'booking',
      title: 'Booking Confirmed',
      body: `Your booking ${booking.id} has been confirmed.`,
      communityId,
    }).catch(() => {});

    if (booking.workerId) {
      createNotification({
        workerId: booking.workerId,
        type: 'booking',
        title: 'Booking Confirmed',
        body: `Booking ${booking.id} is confirmed. Please head to the location on ${booking.date} at ${booking.time}.`,
        communityId,
      }).catch(() => {});
    }

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Update booking status (state machine enforced) ───

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status: newStatus, reason } = req.body;
    if (!newStatus) return error(res, 'status required');

    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return notFound(res, 'Booking');

    // Validate permission: user can only advance user states, worker can only advance worker states
    const actorRole = req.actor.role;
    const workerStates = ['on_the_way', 'arrived', 'in_progress', 'worker_done'];
    const userStates = ['user_done', 'completed'];
    const adminStates = ['cancelled'];

    if (actorRole === 'worker' && !workerStates.includes(newStatus)) {
      return forbidden(res, 'Workers can only update to worker states');
    }
    if (actorRole === 'user' && !userStates.includes(newStatus)) {
      return forbidden(res, 'Users can only update to user states');
    }

    // Verify worker owns the booking
    if (actorRole === 'worker' && booking.workerId !== req.actor.id) {
      return forbidden(res, 'Not your booking');
    }
    if (actorRole === 'user' && booking.userId !== req.actor.id) {
      return forbidden(res, 'Not your booking');
    }

    // Validate state transition
    if (!isValidTransition(booking.status, newStatus)) {
      return error(res, `Invalid transition: ${booking.status} → ${newStatus}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: { status: newStatus },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: newStatus,
          changedBy: req.actor.id,
          changedByRole: actorRole,
          reason: reason || '',
        },
      });

      return b;
    });

    // Notify the other party about status change
    const statusMessages = {
      on_the_way: { to: 'user', userId: booking.userId, title: 'Worker On The Way', body: `Your worker is on the way for booking ${booking.id}.` },
      arrived: { to: 'user', userId: booking.userId, title: 'Worker Arrived', body: `Your worker has arrived for booking ${booking.id}.` },
      in_progress: { to: 'user', userId: booking.userId, title: 'Service In Progress', body: `Service has started for booking ${booking.id}.` },
      worker_done: { to: 'user', userId: booking.userId, title: 'Service Completed', body: `Worker has completed the service for booking ${booking.id}. Please confirm.` },
      completed: { to: 'worker', workerId: booking.workerId, title: 'Booking Completed', body: `Booking ${booking.id} has been marked complete by the user.` },
      cancelled: { to: 'both', userId: booking.userId, workerId: booking.workerId, title: 'Booking Cancelled', body: `Booking ${booking.id} has been cancelled.` },
    };
    const msg = statusMessages[newStatus];
    if (msg) {
      if (msg.to === 'user' || msg.to === 'both') {
        createNotification({ userId: msg.userId, type: 'booking', title: msg.title, body: msg.body, communityId: booking.communityId }).catch(() => {});
      }
      if ((msg.to === 'worker' || msg.to === 'both') && msg.workerId) {
        createNotification({ workerId: msg.workerId, type: 'booking', title: msg.title, body: msg.body, communityId: booking.communityId }).catch(() => {});
      }
    }

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Add materials ───

router.post('/:id/materials', authenticate, authorize('worker'), async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, workerId: req.actor.id },
    });
    if (!booking) return notFound(res, 'Booking');

    if (!['in_progress', 'worker_done'].includes(booking.status)) {
      return error(res, 'Materials can only be added during or after service');
    }

    const { materials } = req.body;
    if (!Array.isArray(materials)) return error(res, 'materials array required');

    const created = [];
    for (const m of materials) {
      const totalCost = (m.quantity || 1) * (m.unitCost || m.cost || 0);
      const item = await prisma.materialItem.create({
        data: {
          bookingId: booking.id,
          name: m.name,
          quantity: m.quantity || 1,
          unitCost: m.unitCost || m.cost || 0,
          totalCost,
          addedBy: req.actor.id,
        },
      });
      created.push(item);
    }

    // Update booking material total — server calculates, not frontend
    const allMaterials = await prisma.materialItem.findMany({ where: { bookingId: booking.id } });
    const materialTotal = allMaterials.reduce((sum, m) => sum + m.totalCost, 0);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { materialTotal },
    });

    return success(res, created, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── USER: Get own bookings ───

router.get('/user/mine', authenticate, authorize('user'), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.actor.id },
      include: {
        service: true,
        materials: true,
        worker: { select: { id: true, name: true, mobile: true, rating: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, bookings);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Get assigned bookings ───

router.get('/worker/mine', authenticate, authorize('worker'), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { workerId: req.actor.id },
      include: {
        service: true,
        materials: true,
        user: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, bookings);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Get incoming requests (eligible) ───

router.get('/worker/incoming', authenticate, authorize('worker'), async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.actor.id },
      include: { skills: true },
    });
    if (!worker) return notFound(res, 'Worker');

    // Only verified workers receive requests
    if (worker.verificationStatus !== 'approved') {
      return success(res, []);
    }

    const skillIds = worker.skills.map((s) => s.serviceId);

    const requests = await prisma.booking.findMany({
      where: {
        serviceId: { in: skillIds },
        status: { in: ['requested', 'workers_notified', 'workers_accepting'] },
        workerId: null, // Not yet assigned
      },
      include: {
        service: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, requests);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Accept a request ───

router.post('/:id/accept', authenticate, authorize('worker'), async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: req.actor.id } });
    if (!worker || worker.verificationStatus !== 'approved') {
      return forbidden(res, 'Only verified workers can accept requests');
    }

    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return notFound(res, 'Booking');

    if (!['requested', 'workers_notified', 'workers_accepting'].includes(booking.status)) {
      return error(res, 'This booking is no longer accepting workers');
    }

    // Record worker response
    await prisma.bookingWorkerResponse.upsert({
      where: { bookingId_workerId: { bookingId: booking.id, workerId: req.actor.id } },
      update: { response: 'accepted', respondedAt: new Date() },
      create: {
        bookingId: booking.id,
        workerId: req.actor.id,
        response: 'accepted',
        respondedAt: new Date(),
      },
    });

    // Update booking status to workers_accepting if still in requested
    if (booking.status === 'requested') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'workers_accepting' },
      });
    }

    // Notify the user that a worker accepted
    createNotification({
      userId: booking.userId,
      type: 'booking',
      title: 'Worker Accepted Your Request',
      body: `${worker.name} accepted your service request. Select a worker to proceed.`,
    }).catch(() => {});

    return success(res, { message: 'Request accepted' });
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── USER: Rate booking ───

router.post('/:id/rate', authenticate, authorize('user'), async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return error(res, 'Rating must be 1-5');

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.actor.id },
    });
    if (!booking) return notFound(res, 'Booking');

    if (!['completed', 'paid', 'invoiced', 'payment_pending'].includes(booking.status)) {
      return error(res, 'Can only rate completed bookings');
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { rating, review: review || null },
    });

    // Update worker rating
    if (booking.workerId) {
      const workerBookings = await prisma.booking.findMany({
        where: { workerId: booking.workerId, rating: { not: null } },
      });
      const avgRating = workerBookings.reduce((s, b) => s + b.rating, 0) / workerBookings.length;
      await prisma.worker.update({
        where: { id: booking.workerId },
        data: { rating: Math.round(avgRating * 10) / 10, reviewCount: workerBookings.length },
      });
    }

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── GET single booking ───

router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        service: true,
        materials: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        worker: { select: { id: true, name: true, mobile: true, rating: true, avatar: true } },
        user: { select: { id: true, name: true, mobile: true } },
        invoice: true,
        travelCalculation: true,
      },
    });
    if (!booking) return notFound(res, 'Booking');

    // Access control: only the user, assigned worker, or admin of the community can view
    if (
      req.actor.role === 'user' && booking.userId !== req.actor.id ||
      req.actor.role === 'worker' && booking.workerId !== req.actor.id
    ) {
      return forbidden(res);
    }

    return success(res, booking);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: List bookings (community-isolated) ───

router.get('/admin/all', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { communityId: req.communityId },
      include: {
        service: true,
        user: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, bookings);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
