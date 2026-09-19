import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, serverError } from '../../utils/response.js';
import { createNotification } from '../notifications/routes.js';

const router = Router();

// ─── Generate invoice for a booking (server calculates everything) ───

router.post('/generate/:bookingId', authenticate, authorize('worker', 'admin'), async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { materials: true, travelCalculation: true },
    });
    if (!booking) return notFound(res, 'Booking');

    if (!['worker_done', 'user_done', 'completed'].includes(booking.status)) {
      return error(res, 'Invoice can only be generated after service completion');
    }

    // Server calculates — NEVER trust frontend totals
    const serviceCharge = booking.serviceCharge;
    const materialTotal = booking.materials.reduce((sum, m) => sum + m.totalCost, 0);

    // Travel cost — server calculated
    let travelCost = 0;
    if (booking.travelCalculation) {
      travelCost = booking.travelCalculation.calculatedAmount;
    } else {
      // Calculate if not yet done
      const travelConfig = await prisma.travelConfig.findFirst({
        where: { communityId: booking.communityId || undefined },
        orderBy: { createdAt: 'desc' },
      });
      const ratePerKm = travelConfig?.ratePerKm || 18;
      travelCost = Math.round(booking.travelDistance * ratePerKm);
    }

    // Welfare — calculated on SERVICE CHARGE ONLY (NOT materials)
    const welfareRule = await prisma.welfareRule.findFirst({
      where: { communityId: booking.communityId || undefined },
      orderBy: { createdAt: 'desc' },
    });
    const welfarePercentage = welfareRule?.percentage || 2.0;
    const welfareAmount = Math.round(serviceCharge * welfarePercentage / 100);

    const totalAmount = serviceCharge + materialTotal + travelCost;

    // Create or update invoice
    const invoice = await prisma.invoice.upsert({
      where: { bookingId: booking.id },
      update: {
        serviceCharge,
        materialTotal,
        travelCost,
        welfareAmount,
        totalAmount,
        status: 'issued',
        issuedAt: new Date(),
        priceBandVersion: booking.priceBandVersion,
        algorithmVersion: booking.algorithmVersion,
      },
      create: {
        bookingId: booking.id,
        serviceCharge,
        materialTotal,
        travelCost,
        welfareAmount,
        totalAmount,
        status: 'issued',
        issuedAt: new Date(),
        priceBandVersion: booking.priceBandVersion,
        algorithmVersion: booking.algorithmVersion,
      },
    });

    // Update booking totals and advance status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { materialTotal, travelCost, total: totalAmount, status: 'invoiced' },
    });

    // Status history
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: 'invoiced',
        changedBy: req.actor.id,
        changedByRole: req.actor.role,
      },
    }).catch(() => {});

    // Create welfare contribution entry (separate ledger)
    if (booking.workerId && welfareAmount > 0) {
      await prisma.welfareContribution.create({
        data: {
          communityId: booking.communityId || '',
          workerId: booking.workerId,
          bookingId: booking.id,
          earningBasis: serviceCharge,
          percentage: welfarePercentage,
          amount: welfareAmount,
          ruleVersion: welfareRule?.version || '1.0',
        },
      }).catch(() => {});
    }

    // Notify user about invoice
    createNotification({
      userId: booking.userId,
      type: 'payment',
      title: 'Invoice Generated',
      body: `Invoice for booking ${booking.id}: ₹${totalAmount}. Please proceed to payment.`,
      communityId: booking.communityId,
    }).catch(() => {});

    return success(res, invoice);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Get invoice for booking ───

router.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { bookingId: req.params.bookingId },
      include: { booking: { include: { materials: true, service: true } } },
    });
    if (!invoice) return notFound(res, 'Invoice');
    return success(res, invoice);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
