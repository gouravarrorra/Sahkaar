import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { success, error, notFound, forbidden, serverError } from '../../utils/response.js';
import { createAuditLog, createAdminActionLog } from '../../utils/audit.js';
import { createNotification } from '../notifications/routes.js';

const router = Router();

const RANGE_TOLERANCE = 0.15;

// Service complexity weights for fair price calculation
const serviceComplexity = {
  electrician: 1.0, plumber: 1.2, carpenter: 1.4, painter: 1.6,
  domestic_helper: 0.8, caregiver: 1.2, driver: 1.0, gardener: 0.8,
  cleaner: 1.0, technician: 1.2,
};

/* ═══════════════════════════════════════════
   PRICE BANDS
   ═══════════════════════════════════════════ */

// GET all price bands (admin — community scoped)
router.get('/bands', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const bands = await prisma.priceBand.findMany({
      where: { communityId: req.communityId },
      include: { service: true },
    });
    return success(res, bands);
  } catch (err) {
    return serverError(res, err);
  }
});

// GET approved price for a service (public — used during booking)
router.get('/approved-price/:serviceId', async (req, res) => {
  try {
    const band = await prisma.priceBand.findFirst({
      where: { serviceId: req.params.serviceId, status: 'active' },
    });
    if (!band) return success(res, { serviceId: req.params.serviceId, reference: 250 });
    return success(res, { serviceId: band.serviceId, reference: band.reference, minimum: band.minimum, maximum: band.maximum, version: band.version });
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Update reference price (must be within existing band range)
const updateRefSchema = z.object({
  newReference: z.number().positive(),
  reason: z.string().min(1),
});

router.patch('/bands/:serviceId/reference', authenticate, authorize('admin'), communityGuard, validate(updateRefSchema), async (req, res) => {
  try {
    const { newReference, reason } = req.validated;
    const band = await prisma.priceBand.findFirst({
      where: { serviceId: req.params.serviceId, communityId: req.communityId },
    });
    if (!band) return notFound(res, 'Price band');

    // ENFORCE: new reference must be within current min-max
    if (newReference < band.minimum || newReference > band.maximum) {
      return error(res, `Price ₹${newReference} is outside the governed range ₹${band.minimum}–₹${band.maximum}. An exception is required.`);
    }

    const previous = band.reference;
    const updated = await prisma.priceBand.update({
      where: { id: band.id },
      data: {
        reference: newReference,
        version: band.version + 1,
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: req.actor.id,
      },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'PRICE_CHANGE',
      entityType: 'price_band',
      entityId: band.serviceId,
      previousValue: `₹${previous}`,
      newValue: `₹${newReference}`,
      reason,
    });

    await createAdminActionLog({
      communityId: req.communityId,
      adminId: req.actor.id,
      action: 'Price Change',
      category: 'pricing',
      previousValue: `₹${previous}`,
      newValue: `₹${newReference}`,
      reason,
    });

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Update full band (after governed review)
const updateBandSchema = z.object({
  newMin: z.number().positive(),
  newRef: z.number().positive(),
  newMax: z.number().positive(),
  reviewedBy: z.string().min(1),
  reason: z.string().min(1),
});

router.put('/bands/:serviceId', authenticate, authorize('admin'), communityGuard, validate(updateBandSchema), async (req, res) => {
  try {
    const { newMin, newRef, newMax, reviewedBy, reason } = req.validated;

    if (newMin > newRef || newRef > newMax) {
      return error(res, 'Invalid band: minimum ≤ reference ≤ maximum required');
    }

    const band = await prisma.priceBand.findFirst({
      where: { serviceId: req.params.serviceId, communityId: req.communityId },
    });
    if (!band) return notFound(res, 'Price band');

    const previous = `₹${band.minimum}–₹${band.reference}–₹${band.maximum}`;
    const newValue = `₹${newMin}–₹${newRef}–₹${newMax}`;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 90);

    const updated = await prisma.priceBand.update({
      where: { id: band.id },
      data: {
        minimum: newMin,
        reference: newRef,
        maximum: newMax,
        version: band.version + 1,
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: req.actor.id,
        reviewedBy,
        lastReviewDate: new Date().toISOString().split('T')[0],
        nextReviewDate: nextReview.toISOString().split('T')[0],
      },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'PRICE_BAND_UPDATE',
      entityType: 'price_band',
      entityId: band.serviceId,
      previousValue: previous,
      newValue: newValue,
      reason,
    });

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   FAIR PRICE ENGINE (server-side calculation)
   ═══════════════════════════════════════════ */

router.get('/fair-range/:serviceId', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const communityId = req.communityId;

    // Get algorithm
    const algo = await prisma.pricingAlgorithmVersion.findFirst({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    });
    const params = algo ? JSON.parse(algo.parameters) : {
      historicalWeight: 0.30, complexityWeight: 0.15,
      workerProposalWeight: 0.25, consumerFeedbackWeight: 0.15,
      marketConditionWeight: 0.15, rangeTolerance: RANGE_TOLERANCE,
    };

    const complexity = serviceComplexity[serviceId] || 1.0;

    // Historical prices
    const completedBookings = await prisma.booking.findMany({
      where: { serviceId, status: 'completed', serviceCharge: { gt: 0 } },
      select: { serviceCharge: true },
    });

    const band = await prisma.priceBand.findFirst({ where: { serviceId, communityId } });
    const fallbackRef = band?.reference || 250;

    const historicalAvg = completedBookings.length > 0
      ? completedBookings.reduce((s, b) => s + b.serviceCharge, 0) / completedBookings.length
      : fallbackRef;

    // Worker proposals (median of active)
    const proposals = await prisma.priceProposal.findMany({
      where: { serviceId, communityId, status: 'submitted' },
      select: { proposedPrice: true },
      orderBy: { proposedPrice: 'asc' },
    });
    const proposalMedian = proposals.length > 0
      ? proposals[Math.floor(proposals.length / 2)].proposedPrice
      : historicalAvg;

    // Consumer feedback
    const feedbacks = await prisma.consumerPriceFeedback.findMany({
      where: { serviceId, satisfaction: { gt: 0 } },
    });
    const avgSatisfaction = feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.satisfaction, 0) / feedbacks.length
      : 3;
    const consumerFactor = 1 + ((avgSatisfaction - 3) * 0.03);

    const basePrice = 250;
    const weightedPrice =
      (historicalAvg * params.historicalWeight) +
      (basePrice * complexity * params.complexityWeight) +
      (proposalMedian * params.workerProposalWeight) +
      (historicalAvg * consumerFactor * params.consumerFeedbackWeight) +
      (historicalAvg * params.marketConditionWeight);

    const reference = Math.round(weightedPrice);
    const tolerance = params.rangeTolerance || RANGE_TOLERANCE;
    const minimum = Math.round(reference * (1 - tolerance));
    const maximum = Math.round(reference * (1 + tolerance));

    return success(res, {
      serviceId,
      minimum,
      reference,
      maximum,
      algorithmVersion: algo?.version || '1.0',
      inputSummary: {
        historicalAvg: Math.round(historicalAvg),
        proposalMedian: Math.round(proposalMedian),
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        completedBookings: completedBookings.length,
        activeProposals: proposals.length,
        feedbackCount: feedbacks.length,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   WORKER PROPOSALS
   ═══════════════════════════════════════════ */

const proposalSchema = z.object({
  serviceId: z.string().min(1),
  proposedPrice: z.number().positive(),
  reasonId: z.string().min(1),
  explanation: z.string().optional().default(''),
});

// WORKER: Submit price proposal
router.post('/proposals', authenticate, authorize('worker'), validate(proposalSchema), async (req, res) => {
  try {
    const { serviceId, proposedPrice, reasonId, explanation } = req.validated;
    const workerId = req.actor.id;

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) return notFound(res, 'Worker');

    const band = await prisma.priceBand.findFirst({
      where: { serviceId, communityId: worker.communityId },
    });

    const withinRange = band
      ? (proposedPrice >= band.minimum && proposedPrice <= band.maximum)
        ? 'within_range'
        : proposedPrice > band.maximum ? 'above_range' : 'below_range'
      : 'unknown';

    const proposal = await prisma.$transaction(async (tx) => {
      const p = await tx.priceProposal.create({
        data: {
          communityId: worker.communityId,
          workerId,
          serviceId,
          proposedPrice,
          currentReference: band?.reference || 0,
          reasonId,
          explanation,
          withinRange,
        },
      });

      // Auto-create exception if above range
      if (withinRange === 'above_range' && band) {
        await tx.priceException.create({
          data: {
            communityId: worker.communityId,
            proposalId: p.id,
            serviceId,
            proposedPrice,
            currentRange: `₹${band.minimum}–₹${band.maximum}`,
            difference: proposedPrice - band.maximum,
            reason: reasonId,
            evidence: explanation,
            requestedBy: workerId,
          },
        });
      }

      await createAuditLog({
        communityId: worker.communityId,
        actorId: workerId,
        actorRole: 'worker',
        action: 'PROPOSAL_SUBMITTED',
        entityType: 'price_proposal',
        entityId: p.id,
        previousValue: `₹${band?.reference || 0}`,
        newValue: `₹${proposedPrice}`,
        reason: reasonId,
      });

      return p;
    });

    // Cartel detection (async, non-blocking)
    detectCartelPattern(workerId, serviceId, proposedPrice, worker.communityId).catch(() => {});

    return success(res, proposal, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Get all proposals (community-scoped)
router.get('/proposals', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const { serviceId, status } = req.query;
    const where = { communityId: req.communityId };
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;

    const proposals = await prisma.priceProposal.findMany({
      where,
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, proposals);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Update proposal status
router.patch('/proposals/:id/status', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { status: newStatus } = req.body;
    const validStatuses = ['under_review', 'approved', 'rejected', 'implemented'];
    if (!validStatuses.includes(newStatus)) return error(res, 'Invalid status');

    const proposal = await prisma.priceProposal.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!proposal) return notFound(res, 'Proposal');

    const updated = await prisma.priceProposal.update({
      where: { id: proposal.id },
      data: { status: newStatus },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'PROPOSAL_STATUS_CHANGE',
      entityType: 'price_proposal',
      entityId: proposal.id,
      previousValue: proposal.status,
      newValue: newStatus,
    });

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   EXCEPTIONS (Four-Eyes Principle)
   ═══════════════════════════════════════════ */

router.get('/exceptions', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const exceptions = await prisma.priceException.findMany({
      where: { communityId: req.communityId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, exceptions);
  } catch (err) {
    return serverError(res, err);
  }
});

router.get('/exceptions/pending', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const exceptions = await prisma.priceException.findMany({
      where: {
        communityId: req.communityId,
        status: { in: ['pending_review', 'under_review'] },
      },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, exceptions);
  } catch (err) {
    return serverError(res, err);
  }
});

// Reviewer: Review an exception
router.patch('/exceptions/:id/review', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const { decision, reviewNotes } = req.body;
    if (!['approved', 'rejected', 'under_review'].includes(decision)) {
      return error(res, 'Invalid decision');
    }

    const exc = await prisma.priceException.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!exc) return notFound(res, 'Exception');

    const updated = await prisma.priceException.update({
      where: { id: exc.id },
      data: { status: decision, reviewedBy: req.actor.id, reviewNotes: reviewNotes || '' },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'reviewer',
      action: 'EXCEPTION_REVIEWED',
      entityType: 'price_exception',
      entityId: exc.id,
      previousValue: exc.status,
      newValue: decision,
      reason: reviewNotes || '',
    });

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// Four-eyes approval: second independent approver
router.patch('/exceptions/:id/four-eyes', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const exc = await prisma.priceException.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!exc) return notFound(res, 'Exception');

    // ENFORCE: Cannot approve own request
    if (exc.requestedBy === req.actor.id) {
      return forbidden(res, 'Cannot approve your own request');
    }
    // ENFORCE: Cannot be the same as first reviewer
    if (exc.reviewedBy === req.actor.id) {
      return forbidden(res, 'Same person cannot be both reviewer and approver');
    }

    const updated = await prisma.priceException.update({
      where: { id: exc.id },
      data: { status: 'approved', fourEyesApprover: req.actor.id },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'EXCEPTION_FOUR_EYES_APPROVED',
      entityType: 'price_exception',
      entityId: exc.id,
      previousValue: exc.status,
      newValue: 'approved',
    });

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   CONSUMER FEEDBACK
   ═══════════════════════════════════════════ */

router.post('/feedback', authenticate, authorize('user'), async (req, res) => {
  try {
    const { serviceId, bookingId, satisfaction, affordability, cancelledDueToPrice, complaint } = req.body;

    const feedback = await prisma.consumerPriceFeedback.create({
      data: {
        userId: req.actor.id,
        serviceId,
        bookingId,
        satisfaction: satisfaction || 3,
        affordability: affordability || 'somewhat',
        cancelledDueToPrice: cancelledDueToPrice || false,
        complaint: complaint || '',
      },
    });

    return success(res, feedback, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

router.get('/feedback/stats', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const { serviceId } = req.query;
    const where = {};
    if (serviceId) where.serviceId = serviceId;

    const feedbacks = await prisma.consumerPriceFeedback.findMany({ where });
    if (feedbacks.length === 0) {
      return success(res, { count: 0, avgSatisfaction: 0, affordablePercent: 0, cancelPercent: 0, complaintCount: 0 });
    }

    const avgSatisfaction = feedbacks.reduce((s, f) => s + f.satisfaction, 0) / feedbacks.length;
    const affordableCount = feedbacks.filter(f => f.affordability === 'yes').length;
    const cancelCount = feedbacks.filter(f => f.cancelledDueToPrice).length;
    const complaintCount = feedbacks.filter(f => f.complaint).length;

    return success(res, {
      count: feedbacks.length,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      affordablePercent: Math.round((affordableCount / feedbacks.length) * 100),
      cancelPercent: Math.round((cancelCount / feedbacks.length) * 100),
      complaintCount,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   ALGORITHM VERSIONING
   ═══════════════════════════════════════════ */

router.get('/algorithm', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const versions = await prisma.pricingAlgorithmVersion.findMany({
      where: { communityId: req.communityId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, versions);
  } catch (err) {
    return serverError(res, err);
  }
});

router.post('/algorithm', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { parameters, changeSummary, reason } = req.body;

    const latest = await prisma.pricingAlgorithmVersion.findFirst({
      where: { communityId: req.communityId },
      orderBy: { createdAt: 'desc' },
    });

    const vParts = (latest?.version || '1.0').split('.');
    const newVersion = `${vParts[0]}.${parseInt(vParts[1] || 0) + 1}`;

    const currentParams = latest ? JSON.parse(latest.parameters) : {};
    const mergedParams = { ...currentParams, ...parameters };

    const version = await prisma.pricingAlgorithmVersion.create({
      data: {
        communityId: req.communityId,
        version: newVersion,
        effectiveDate: new Date().toISOString().split('T')[0],
        changeSummary: changeSummary || '',
        reason: reason || '',
        approver: req.actor.id,
        parameters: JSON.stringify(mergedParams),
      },
    });

    await createAuditLog({
      communityId: req.communityId,
      actorId: req.actor.id,
      actorRole: 'admin',
      action: 'ALGORITHM_UPDATE',
      entityType: 'pricing_algorithm',
      previousValue: `v${latest?.version || '1.0'}`,
      newValue: `v${newVersion}`,
      reason: changeSummary || '',
    });

    return success(res, version, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   CARTEL DETECTION
   ═══════════════════════════════════════════ */

async function detectCartelPattern(workerId, serviceId, proposedPrice, communityId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentProposals = await prisma.priceProposal.findMany({
    where: { serviceId, communityId, createdAt: { gte: sevenDaysAgo } },
  });

  const alerts = [];

  // Pattern: identical proposals from different workers
  const identicalCount = recentProposals.filter(
    p => p.proposedPrice === proposedPrice && p.workerId !== workerId
  ).length;
  if (identicalCount >= 2) {
    alerts.push({
      communityId, serviceId,
      type: 'identical_proposals',
      description: `${identicalCount + 1} workers proposed identical price ₹${proposedPrice} for ${serviceId}`,
      severity: 'medium',
    });
  }

  // Pattern: same worker submitting too frequently
  const workerRecent = recentProposals.filter(p => p.workerId === workerId).length;
  if (workerRecent >= 4) {
    alerts.push({
      communityId, serviceId,
      type: 'high_frequency',
      description: `Worker ${workerId} submitted ${workerRecent + 1} proposals in 7 days`,
      severity: 'low',
    });
  }

  // Pattern: coordinated price spike
  const band = await prisma.priceBand.findFirst({ where: { serviceId, communityId } });
  if (band) {
    const spikeThreshold = band.reference * 1.2;
    const spikeProposals = recentProposals.filter(p => p.proposedPrice > spikeThreshold);
    const uniqueWorkers = new Set(spikeProposals.map(p => p.workerId));
    if (proposedPrice > spikeThreshold) uniqueWorkers.add(workerId);
    if (uniqueWorkers.size >= 3) {
      alerts.push({
        communityId, serviceId,
        type: 'coordinated_spike',
        description: `${uniqueWorkers.size} workers proposed >20% above reference for ${serviceId}`,
        severity: 'high',
      });
    }
  }

  for (const alert of alerts) {
    await prisma.cartelAlert.create({ data: alert });
  }
}

// GET cartel alerts
router.get('/cartel-alerts', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const alerts = await prisma.cartelAlert.findMany({
      where: { communityId: req.communityId },
      include: { service: true },
      orderBy: { detectedAt: 'desc' },
    });
    return success(res, alerts);
  } catch (err) {
    return serverError(res, err);
  }
});

// Dismiss cartel alert
router.patch('/cartel-alerts/:id/dismiss', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const alert = await prisma.cartelAlert.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!alert) return notFound(res, 'Alert');

    const updated = await prisma.cartelAlert.update({
      where: { id: alert.id },
      data: { status: 'dismissed', resolvedBy: req.actor.id, resolvedAt: new Date() },
    });

    await createAdminActionLog({
      communityId: req.communityId,
      adminId: req.actor.id,
      action: 'Cartel Alert Dismissed',
      category: 'monitoring',
      previousValue: alert.id,
      newValue: 'dismissed',
    });

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   PRICING STATS
   ═══════════════════════════════════════════ */

router.get('/stats', authenticate, authorize('admin', 'reviewer'), communityGuard, async (req, res) => {
  try {
    const communityId = req.communityId;
    const [activeProposals, pendingExceptions, unresolvedAlerts, totalFeedback, totalAudit] = await Promise.all([
      prisma.priceProposal.count({ where: { communityId, status: 'submitted' } }),
      prisma.priceException.count({ where: { communityId, status: { in: ['pending_review', 'under_review'] } } }),
      prisma.cartelAlert.count({ where: { communityId, status: 'flagged' } }),
      prisma.consumerPriceFeedback.count(),
      prisma.auditLog.count({ where: { communityId } }),
    ]);

    return success(res, { activeProposals, pendingExceptions, unresolvedAlerts, totalFeedback, totalAudit });
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   PRICING COMMITTEE MANAGEMENT
   ═══════════════════════════════════════════ */

// GET committee for community
router.get('/committee', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const committee = await prisma.pricingCommittee.findFirst({
      where: { communityId: req.communityId },
      include: {
        members: {
          include: { worker: { select: { id: true, name: true, mobile: true } } },
        },
      },
    });
    return success(res, committee);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADD member to committee
router.post('/committee/members', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return error(res, 'workerId required');

    // Verify worker belongs to community
    const worker = await prisma.worker.findFirst({
      where: { id: workerId, communityId: req.communityId },
    });
    if (!worker) return error(res, 'Worker not found in your community');

    // Get or create committee
    let committee = await prisma.pricingCommittee.findFirst({
      where: { communityId: req.communityId },
      include: { members: true },
    });

    if (!committee) {
      committee = await prisma.pricingCommittee.create({
        data: { communityId: req.communityId, maxMembers: 5, rotationDays: 180 },
        include: { members: true },
      });
    }

    // Check max members
    if (committee.members.length >= committee.maxMembers) {
      return error(res, `Committee is full (max ${committee.maxMembers} members)`);
    }

    // Check duplicate
    const existing = committee.members.find(m => m.workerId === workerId);
    if (existing) return error(res, 'Worker is already a committee member');

    const member = await prisma.committeeMember.create({
      data: {
        committeeId: committee.id,
        workerId,
        startDate: new Date().toISOString().split('T')[0],
      },
    });

    createNotification({
      workerId,
      type: 'pricing',
      title: 'Pricing Committee Appointment',
      body: 'You have been added to the Pricing Committee.',
      communityId: req.communityId,
    }).catch(() => {});

    return success(res, member, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// REMOVE member from committee
router.delete('/committee/members/:memberId', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const member = await prisma.committeeMember.findUnique({
      where: { id: req.params.memberId },
      include: { committee: true },
    });
    if (!member || member.committee.communityId !== req.communityId) {
      return notFound(res, 'Committee member');
    }

    await prisma.committeeMember.update({
      where: { id: member.id },
      data: { endDate: new Date().toISOString().split('T')[0] },
    });

    createNotification({
      workerId: member.workerId,
      type: 'pricing',
      title: 'Pricing Committee Rotation',
      body: 'You have been rotated out of the Pricing Committee.',
      communityId: req.communityId,
    }).catch(() => {});

    return success(res, { message: 'Member removed from committee' });
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
