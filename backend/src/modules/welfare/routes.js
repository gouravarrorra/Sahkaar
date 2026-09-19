import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, error, notFound, serverError } from '../../utils/response.js';

const router = Router();

// ─── ADMIN: Get welfare rules ───
router.get('/rules', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const rules = await prisma.welfareRule.findMany({
      where: { communityId: req.communityId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, rules);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Create/update welfare rule ───
router.post('/rules', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { percentage, contributionBasis, reason } = req.body;

    // Get current version
    const latest = await prisma.welfareRule.findFirst({
      where: { communityId: req.communityId },
      orderBy: { createdAt: 'desc' },
    });
    const vParts = (latest?.version || '1.0').split('.');
    const newVersion = `${vParts[0]}.${parseInt(vParts[1] || 0) + 1}`;

    const rule = await prisma.welfareRule.create({
      data: {
        communityId: req.communityId,
        version: newVersion,
        contributionBasis: contributionBasis || 'service_charge',
        percentage: percentage || 2.0,
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: req.actor.id,
      },
    });

    return success(res, rule, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── Get worker's welfare contributions ───
router.get('/worker/mine', authenticate, authorize('worker'), async (req, res) => {
  try {
    const contributions = await prisma.welfareContribution.findMany({
      where: { workerId: req.actor.id },
      orderBy: { createdAt: 'desc' },
    });

    const total = contributions.reduce((s, c) => s + c.amount, 0);

    return success(res, { contributions, totalContributed: total });
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Community welfare ledger ───
router.get('/contributions', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const contributions = await prisma.welfareContribution.findMany({
      where: { communityId: req.communityId },
      include: { worker: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const total = contributions.reduce((s, c) => s + c.amount, 0);

    return success(res, { contributions, totalContributed: total });
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
