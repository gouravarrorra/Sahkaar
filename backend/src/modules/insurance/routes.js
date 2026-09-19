import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, serverError } from '../../utils/response.js';

const router = Router();

// ─── ADMIN: List insurance plans ───
router.get('/plans', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const plans = await prisma.insurancePlan.findMany({
      where: { communityId: req.communityId },
    });
    return success(res, plans);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Create insurance plan ───
router.post('/plans', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { name, coverage, monthlyPremium, terms } = req.body;
    const plan = await prisma.insurancePlan.create({
      data: {
        communityId: req.communityId,
        name,
        coverage: coverage || 50000,
        monthlyPremium: monthlyPremium || 60,
        terms: terms || '',
      },
    });
    return success(res, plan, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Enroll in plan ───
router.post('/enroll', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return error(res, 'planId required');

    const plan = await prisma.insurancePlan.findUnique({ where: { id: planId } });
    if (!plan) return notFound(res, 'Insurance plan');

    // Check if already enrolled
    const existing = await prisma.workerInsurance.findFirst({
      where: { workerId: req.actor.id, planId, status: { in: ['active', 'due'] } },
    });
    if (existing) return error(res, 'Already enrolled in this plan');

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    const enrollment = await prisma.workerInsurance.create({
      data: {
        workerId: req.actor.id,
        planId,
        nextDueDate: nextMonth.toISOString().split('T')[0],
      },
    });

    return success(res, enrollment, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Get my insurance ───
router.get('/worker/mine', authenticate, authorize('worker'), async (req, res) => {
  try {
    const enrollments = await prisma.workerInsurance.findMany({
      where: { workerId: req.actor.id },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' } }, claims: true },
    });
    return success(res, enrollments);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Make monthly premium payment ───
// Insurance is monthly, NOT per-service percentage
router.post('/premium-payment', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { workerInsuranceId, periodMonth } = req.body;

    const enrollment = await prisma.workerInsurance.findFirst({
      where: { id: workerInsuranceId, workerId: req.actor.id },
      include: { plan: true },
    });
    if (!enrollment) return notFound(res, 'Insurance enrollment');

    // Prevent duplicate payment for same month
    const existing = await prisma.insurancePayment.findUnique({
      where: { workerInsuranceId_periodMonth: { workerInsuranceId, periodMonth } },
    });
    if (existing && existing.status === 'paid') {
      return error(res, 'Premium already paid for this month');
    }

    const payment = await prisma.insurancePayment.upsert({
      where: { workerInsuranceId_periodMonth: { workerInsuranceId, periodMonth } },
      update: { status: 'paid', paidAt: new Date() },
      create: {
        workerInsuranceId,
        amount: enrollment.plan.monthlyPremium,
        periodMonth,
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Update next due date
    const [year, month] = periodMonth.split('-').map(Number);
    const nextDue = new Date(year, month, 1); // month is 0-indexed but we want next
    await prisma.workerInsurance.update({
      where: { id: workerInsuranceId },
      data: {
        status: 'active',
        nextDueDate: nextDue.toISOString().split('T')[0],
      },
    });

    return success(res, payment);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── WORKER: Submit claim ───
router.post('/claims', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { workerInsuranceId, description, amount } = req.body;

    const enrollment = await prisma.workerInsurance.findFirst({
      where: { id: workerInsuranceId, workerId: req.actor.id },
    });
    if (!enrollment) return notFound(res, 'Insurance enrollment');

    const claim = await prisma.insuranceClaim.create({
      data: { workerInsuranceId, description, amount: amount || 0 },
    });

    return success(res, claim, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: All enrollments ───
router.get('/enrollments', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const enrollments = await prisma.workerInsurance.findMany({
      where: {
        worker: { communityId: req.communityId },
      },
      include: {
        plan: true,
        worker: { select: { id: true, name: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    return success(res, enrollments);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
