import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { success, error, notFound, forbidden, serverError } from '../../utils/response.js';
import { createAuditLog } from '../../utils/audit.js';
import { createNotification } from '../notifications/routes.js';

const router = Router();

// ─── Generate booking-specific payment reference (QR payload) ───

router.post('/generate-reference/:bookingId', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { invoice: true },
    });
    if (!booking) return notFound(res, 'Booking');

    // Server calculates amount — NEVER trust frontend
    const invoice = booking.invoice;
    if (!invoice) return error(res, 'Invoice not yet generated');

    const amount = invoice.totalAmount;
    const transactionId = `TXN${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;

    const payment = await prisma.payment.create({
      data: {
        communityId: booking.communityId,
        bookingId: booking.id,
        userId: booking.userId,
        workerId: booking.workerId,
        amount, // Server-calculated, not client
        transactionId,
      },
    });

    // QR payload data — worker does NOT use personal QR
    const qrPayload = {
      bookingId: booking.id,
      transactionId: payment.transactionId,
      userId: booking.userId,
      workerId: booking.workerId,
      amount,
      ref: payment.id,
    };

    // Advance booking to payment_pending
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'payment_pending' },
    }).catch(() => {});

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status || 'invoiced',
        toStatus: 'payment_pending',
        changedBy: req.actor.id,
        changedByRole: req.actor.role,
      },
    }).catch(() => {});

    return success(res, { payment, qrPayload });
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Confirm payment (validates amount server-side) ───

router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { transactionId, paymentMethod } = req.body;
    if (!transactionId) return error(res, 'transactionId required');

    // Find payment — use transactionId for idempotency
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
    });
    if (!payment) return notFound(res, 'Payment');

    // Prevent duplicate confirmation
    if (payment.paymentStatus === 'paid') {
      return success(res, { message: 'Already paid', payment });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'paid',
          paymentMethod: paymentMethod || 'digital',
          completedAt: new Date(),
        },
      });

      // Update booking payment status
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: 'paid', paymentMethod: paymentMethod || 'digital', status: 'paid' },
      });

      // Update worker earnings
      if (payment.workerId) {
        await tx.worker.update({
          where: { id: payment.workerId },
          data: {
            totalEarnings: { increment: payment.amount },
            monthEarnings: { increment: payment.amount },
          },
        });
      }

      return p;
    });

    // Status history for payment
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: payment.bookingId,
        fromStatus: 'payment_pending',
        toStatus: 'paid',
        changedBy: req.actor.id,
        changedByRole: req.actor.role,
      },
    }).catch(() => {});

    await createAuditLog({
      communityId: payment.communityId,
      actorId: req.actor.id,
      actorRole: req.actor.role,
      action: 'PAYMENT_CONFIRMED',
      entityType: 'payment',
      entityId: payment.id,
      newValue: `₹${payment.amount}`,
      reason: `TransactionId: ${transactionId}`,
    });

    // Notify both parties
    createNotification({
      userId: payment.userId,
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ₹${payment.amount} for booking completed.`,
      communityId: payment.communityId,
    }).catch(() => {});

    if (payment.workerId) {
      createNotification({
        workerId: payment.workerId,
        type: 'payment',
        title: 'Payment Received',
        body: `₹${payment.amount} received for your service.`,
        communityId: payment.communityId,
      }).catch(() => {});
    }

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── GET payment history for a booking ───

router.get('/booking/:bookingId', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { bookingId: req.params.bookingId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, payments);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Community payment ledger ───

router.get('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { communityId: req.communityId },
      include: {
        booking: { select: { id: true, serviceId: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, payments);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
