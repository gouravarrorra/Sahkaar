import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const PricingContext = createContext();

/* ═══════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════ */

const STORAGE_KEY = 'sahkaar-pricing';
const REVIEW_CYCLE_DAYS = 90; // 3 months
const EMERGENCY_MAX_DAYS = 30;
const COMMITTEE_MAX_MEMBERS = 3;
const COMMITTEE_ROTATION_DAYS = 180;
const RANGE_TOLERANCE = 0.15; // ±15% from reference

export const proposalReasons = [
  { id: 'increased_operating_cost', label: 'Increased Operating Cost' },
  { id: 'increased_travel', label: 'Increased Travel Burden' },
  { id: 'increased_skill', label: 'Increased Skill Requirement' },
  { id: 'increased_service_time', label: 'Increased Average Service Time' },
  { id: 'local_economic', label: 'Local Economic Conditions' },
  { id: 'training_certification', label: 'Training / Certification Requirement' },
  { id: 'material_cost_increase', label: 'Material Cost Increase' },
  { id: 'other', label: 'Other Documented Reason' },
];

export const proposalStatuses = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'implemented', label: 'Implemented' },
];

export const exceptionStatuses = [
  { id: 'pending_review', label: 'Pending Review' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'implemented', label: 'Implemented' },
];

export const priceBandStatuses = [
  { id: 'active', label: 'Active' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'pending_approval', label: 'Pending Approval' },
];

// Base service complexity weights for fair price calculation
const serviceComplexity = {
  electrician: 1.0,
  plumber: 1.2,
  carpenter: 1.4,
  painter: 1.6,
  domestic_helper: 0.8,
  caregiver: 1.2,
  driver: 1.0,
  gardener: 0.8,
  cleaner: 1.0,
  technician: 1.2,
};

/* ═══════════════════════════════════════════════
   ID GENERATORS
   ═══════════════════════════════════════════════ */

function genId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ═══════════════════════════════════════════════
   INITIAL SEED DATA
   ═══════════════════════════════════════════════ */

const initialPriceBands = {
  electrician:    { serviceId: 'electrician',    minimum: 210, reference: 250, maximum: 290, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  plumber:        { serviceId: 'plumber',        minimum: 250, reference: 300, maximum: 350, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  carpenter:      { serviceId: 'carpenter',      minimum: 300, reference: 350, maximum: 400, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  painter:        { serviceId: 'painter',        minimum: 340, reference: 400, maximum: 460, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  domestic_helper: { serviceId: 'domestic_helper', minimum: 160, reference: 200, maximum: 240, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  caregiver:      { serviceId: 'caregiver',      minimum: 250, reference: 300, maximum: 350, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  driver:         { serviceId: 'driver',         minimum: 210, reference: 250, maximum: 290, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  gardener:       { serviceId: 'gardener',       minimum: 160, reference: 200, maximum: 240, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  cleaner:        { serviceId: 'cleaner',        minimum: 210, reference: 250, maximum: 290, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
  technician:     { serviceId: 'technician',     minimum: 250, reference: 300, maximum: 350, status: 'active', version: 1, effectiveDate: '2026-09-01', approvedBy: 'A001', reviewedBy: 'PRICING_PANEL', lastReviewDate: '2026-09-01', nextReviewDate: '2026-12-01' },
};

const initialAlgorithm = {
  version: '1.0',
  effectiveDate: '2026-09-01',
  changeSummary: 'Initial pricing algorithm — weighted average of historical prices, complexity, worker proposals (median), consumer feedback',
  reason: 'System initialization',
  approver: 'SYSTEM',
  parameters: {
    historicalWeight: 0.30,
    complexityWeight: 0.15,
    workerProposalWeight: 0.25,
    consumerFeedbackWeight: 0.15,
    marketConditionWeight: 0.15,
    rangeTolerance: RANGE_TOLERANCE,
  },
};

const initialCommittee = {
  members: [],
  maxMembers: COMMITTEE_MAX_MEMBERS,
  rotationDays: COMMITTEE_ROTATION_DAYS,
  lastRotation: null,
  decisions: [],
};

function getInitialState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return {
    priceBands: initialPriceBands,
    proposals: [],
    exceptions: [],
    consumerFeedback: [],
    auditTrail: [],
    adminActionLog: [],
    algorithmVersions: [initialAlgorithm],
    committee: initialCommittee,
    emergencyAdjustments: [],
    cartelAlerts: [],
  };
}

/* ═══════════════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════════════ */

export function PricingProvider({ children }) {
  const [state, setState] = useState(getInitialState);

  const persist = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /* ─── Audit Trail (append-only) ─── */
  const addAudit = useCallback((action, actor, actorRole, serviceId, previousValue, newValue, reason) => {
    const record = { id: genId('AUD'), action, actor, actorRole, serviceId, previousValue, newValue, reason, timestamp: new Date().toISOString() };
    persist(prev => ({ ...prev, auditTrail: [...prev.auditTrail, record] }));
    return record;
  }, [persist]);

  /* ─── Admin Action Log ─── */
  const addAdminAction = useCallback((adminId, action, category, previousValue, newValue, reason) => {
    const record = { id: genId('AAL'), adminId, action, category, previousValue, newValue, reason, timestamp: new Date().toISOString() };
    persist(prev => ({ ...prev, adminActionLog: [...prev.adminActionLog, record] }));
    return record;
  }, [persist]);

  /* ═══════════════════════════════════════════
     PRICE BANDS
     ═══════════════════════════════════════════ */

  const getPriceBand = useCallback((serviceId) => {
    return state.priceBands[serviceId] || null;
  }, [state.priceBands]);

  const getAllPriceBands = useCallback(() => {
    return Object.values(state.priceBands);
  }, [state.priceBands]);

  const getApprovedPrice = useCallback((serviceId) => {
    // Check for active emergency adjustment first
    const emergency = state.emergencyAdjustments.find(
      e => e.serviceId === serviceId && e.status === 'active' && new Date(e.endDate) > new Date()
    );
    if (emergency) return emergency.adjustedPrice;

    const band = state.priceBands[serviceId];
    return band ? band.reference : 250; // fallback
  }, [state.priceBands, state.emergencyAdjustments]);

  // Admin can only update price within governed range (or via approved exception)
  const updatePriceBand = useCallback((serviceId, newReference, adminId, reason) => {
    const band = state.priceBands[serviceId];
    if (!band) return false;

    // Enforce: new reference must be within current min-max
    if (newReference < band.minimum || newReference > band.maximum) {
      return false; // Requires exception
    }

    const previousValue = band.reference;
    persist(prev => ({
      ...prev,
      priceBands: {
        ...prev.priceBands,
        [serviceId]: {
          ...prev.priceBands[serviceId],
          reference: newReference,
          version: prev.priceBands[serviceId].version + 1,
          effectiveDate: new Date().toISOString().split('T')[0],
          approvedBy: adminId,
        },
      },
    }));

    addAudit('PRICE_CHANGE', adminId, 'admin', serviceId, `₹${previousValue}`, `₹${newReference}`, reason);
    addAdminAction(adminId, 'Price Change', 'pricing', `₹${previousValue}`, `₹${newReference}`, reason);
    return true;
  }, [state.priceBands, persist, addAudit, addAdminAction]);

  // Update the full band (min/ref/max) after a governed review
  const updateFullPriceBand = useCallback((serviceId, newMin, newRef, newMax, adminId, reviewedBy, reason) => {
    const band = state.priceBands[serviceId];
    if (!band) return false;

    const previous = `₹${band.minimum}–₹${band.reference}–₹${band.maximum}`;
    const updated = `₹${newMin}–₹${newRef}–₹${newMax}`;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + REVIEW_CYCLE_DAYS);

    persist(prev => ({
      ...prev,
      priceBands: {
        ...prev.priceBands,
        [serviceId]: {
          ...prev.priceBands[serviceId],
          minimum: newMin,
          reference: newRef,
          maximum: newMax,
          version: prev.priceBands[serviceId].version + 1,
          effectiveDate: new Date().toISOString().split('T')[0],
          approvedBy: adminId,
          reviewedBy,
          lastReviewDate: new Date().toISOString().split('T')[0],
          nextReviewDate: nextReview.toISOString().split('T')[0],
        },
      },
    }));

    addAudit('PRICE_BAND_UPDATE', adminId, 'admin', serviceId, previous, updated, reason);
    addAdminAction(adminId, 'Price Band Update', 'pricing', previous, updated, reason);
    return true;
  }, [state.priceBands, persist, addAudit, addAdminAction]);

  /* ═══════════════════════════════════════════
     FAIR PRICE RANGE ENGINE
     ═══════════════════════════════════════════ */

  const calculateFairRange = useCallback((serviceId, completedBookings = []) => {
    const algo = state.algorithmVersions[state.algorithmVersions.length - 1];
    const params = algo.parameters;
    const complexity = serviceComplexity[serviceId] || 1.0;

    // Historical price analysis
    const historicalPrices = completedBookings
      .filter(b => b.service === serviceId && b.serviceCharge > 0)
      .map(b => b.serviceCharge);

    const historicalAvg = historicalPrices.length > 0
      ? historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length
      : state.priceBands[serviceId]?.reference || 250;

    // Worker proposal median (active proposals only)
    const activeProposals = state.proposals
      .filter(p => p.serviceId === serviceId && p.status === 'submitted')
      .map(p => p.proposedPrice)
      .sort((a, b) => a - b);

    const proposalMedian = activeProposals.length > 0
      ? activeProposals[Math.floor(activeProposals.length / 2)]
      : historicalAvg;

    // Consumer feedback score (1-5, higher = more affordable)
    const feedbacks = state.consumerFeedback
      .filter(f => f.serviceId === serviceId && f.satisfaction > 0);

    const avgSatisfaction = feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.satisfaction, 0) / feedbacks.length
      : 3; // neutral

    // Consumer adjustment: if satisfaction < 3, slight downward pressure; > 3, upward allowed
    const consumerFactor = 1 + ((avgSatisfaction - 3) * 0.03);

    // Weighted calculation
    const basePrice = 250; // absolute floor
    const weightedPrice =
      (historicalAvg * params.historicalWeight) +
      (basePrice * complexity * params.complexityWeight) +
      (proposalMedian * params.workerProposalWeight) +
      (historicalAvg * consumerFactor * params.consumerFeedbackWeight) +
      (historicalAvg * params.marketConditionWeight);

    const reference = Math.round(weightedPrice);
    const tolerance = params.rangeTolerance;
    const minimum = Math.round(reference * (1 - tolerance));
    const maximum = Math.round(reference * (1 + tolerance));

    return { minimum, reference, maximum };
  }, [state.algorithmVersions, state.proposals, state.consumerFeedback, state.priceBands]);

  /* ═══════════════════════════════════════════
     WORKER PROPOSALS
     ═══════════════════════════════════════════ */

  const submitProposal = useCallback((workerId, serviceId, proposedPrice, reasonId, explanation) => {
    const band = state.priceBands[serviceId];
    const withinRange = band
      ? (proposedPrice >= band.minimum && proposedPrice <= band.maximum)
        ? 'within_range'
        : proposedPrice > band.maximum
          ? 'above_range'
          : 'below_range'
      : 'unknown';

    const proposal = {
      id: genId('PPR'),
      workerId,
      serviceId,
      proposedPrice,
      reasonId,
      explanation,
      currentReference: band?.reference || 0,
      withinRange,
      status: 'submitted',
      timestamp: new Date().toISOString(),
    };

    persist(prev => ({ ...prev, proposals: [...prev.proposals, proposal] }));
    addAudit('PROPOSAL_SUBMITTED', workerId, 'worker', serviceId, `₹${band?.reference || 0}`, `₹${proposedPrice}`, reasonId);

    // Auto-create exception if above range
    if (withinRange === 'above_range') {
      const exception = {
        id: genId('EXC'),
        proposalId: proposal.id,
        serviceId,
        proposedPrice,
        currentRange: `₹${band?.minimum}–₹${band?.maximum}`,
        difference: proposedPrice - (band?.maximum || 0),
        reason: reasonId,
        evidence: explanation,
        requestedBy: workerId,
        status: 'pending_review',
        reviewedBy: null,
        reviewNotes: '',
        fourEyesApprover: null,
        timestamp: new Date().toISOString(),
      };
      persist(prev => ({ ...prev, exceptions: [...prev.exceptions, exception] }));
    }

    // Cartel detection
    detectCartelPattern(workerId, serviceId, proposedPrice);

    return proposal;
  }, [state.priceBands, persist, addAudit]);

  // Workers can only see their OWN proposals
  const getMyProposals = useCallback((workerId) => {
    return state.proposals.filter(p => p.workerId === workerId);
  }, [state.proposals]);

  // Admin sees all proposals (anonymized worker IDs kept for review)
  const getAllProposals = useCallback((serviceId = null) => {
    if (serviceId) return state.proposals.filter(p => p.serviceId === serviceId);
    return state.proposals;
  }, [state.proposals]);

  const getActiveProposals = useCallback((serviceId = null) => {
    const active = state.proposals.filter(p => p.status === 'submitted');
    if (serviceId) return active.filter(p => p.serviceId === serviceId);
    return active;
  }, [state.proposals]);

  const updateProposalStatus = useCallback((proposalId, newStatus, adminId) => {
    persist(prev => ({
      ...prev,
      proposals: prev.proposals.map(p =>
        p.id === proposalId ? { ...p, status: newStatus } : p
      ),
    }));
    addAudit('PROPOSAL_STATUS_CHANGE', adminId, 'admin', null, null, newStatus, `Proposal ${proposalId}`);
  }, [persist, addAudit]);

  /* ═══════════════════════════════════════════
     EXCEPTIONS (Four-Eyes Principle)
     ═══════════════════════════════════════════ */

  const getAllExceptions = useCallback(() => state.exceptions, [state.exceptions]);

  const getPendingExceptions = useCallback(() => {
    return state.exceptions.filter(e => e.status === 'pending_review' || e.status === 'under_review');
  }, [state.exceptions]);

  const reviewException = useCallback((exceptionId, reviewerId, reviewNotes, decision) => {
    persist(prev => ({
      ...prev,
      exceptions: prev.exceptions.map(e =>
        e.id === exceptionId
          ? { ...e, status: decision, reviewedBy: reviewerId, reviewNotes }
          : e
      ),
    }));
    addAudit('EXCEPTION_REVIEWED', reviewerId, 'reviewer', null, 'pending_review', decision, reviewNotes);
  }, [persist, addAudit]);

  // Four-eyes: a second approver confirms
  const fourEyesApproveException = useCallback((exceptionId, approverId) => {
    const exc = state.exceptions.find(e => e.id === exceptionId);
    if (!exc) return false;
    // Cannot approve own request
    if (exc.requestedBy === approverId) return false;
    // Cannot be same as first reviewer
    if (exc.reviewedBy === approverId) return false;

    persist(prev => ({
      ...prev,
      exceptions: prev.exceptions.map(e =>
        e.id === exceptionId
          ? { ...e, status: 'approved', fourEyesApprover: approverId }
          : e
      ),
    }));
    addAudit('EXCEPTION_FOUR_EYES_APPROVED', approverId, 'admin', exc.serviceId, 'under_review', 'approved', `Exception ${exceptionId}`);
    return true;
  }, [state.exceptions, persist, addAudit]);

  /* ═══════════════════════════════════════════
     CONSUMER FEEDBACK
     ═══════════════════════════════════════════ */

  const addConsumerFeedback = useCallback((userId, serviceId, bookingId, satisfaction, affordability, cancelledDueToPrice = false, complaint = '') => {
    const feedback = {
      id: genId('CFB'),
      userId,
      serviceId,
      bookingId,
      satisfaction, // 1–5
      affordability, // 'yes' | 'somewhat' | 'no'
      cancelledDueToPrice,
      complaint,
      timestamp: new Date().toISOString(),
    };
    persist(prev => ({ ...prev, consumerFeedback: [...prev.consumerFeedback, feedback] }));
    return feedback;
  }, [persist]);

  const getConsumerFeedbackStats = useCallback((serviceId = null) => {
    const feedbacks = serviceId
      ? state.consumerFeedback.filter(f => f.serviceId === serviceId)
      : state.consumerFeedback;

    if (feedbacks.length === 0) return { count: 0, avgSatisfaction: 0, affordablePercent: 0, cancelPercent: 0, complaintCount: 0 };

    const avgSatisfaction = feedbacks.reduce((s, f) => s + f.satisfaction, 0) / feedbacks.length;
    const affordableCount = feedbacks.filter(f => f.affordability === 'yes').length;
    const cancelCount = feedbacks.filter(f => f.cancelledDueToPrice).length;
    const complaintCount = feedbacks.filter(f => f.complaint).length;

    return {
      count: feedbacks.length,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      affordablePercent: Math.round((affordableCount / feedbacks.length) * 100),
      cancelPercent: Math.round((cancelCount / feedbacks.length) * 100),
      complaintCount,
    };
  }, [state.consumerFeedback]);

  /* ═══════════════════════════════════════════
     PRICING COMMITTEE
     ═══════════════════════════════════════════ */

  const getCommittee = useCallback(() => state.committee, [state.committee]);

  const addCommitteeMember = useCallback((workerId, adminId) => {
    if (state.committee.members.length >= COMMITTEE_MAX_MEMBERS) return false;
    if (state.committee.members.includes(workerId)) return false;

    persist(prev => ({
      ...prev,
      committee: {
        ...prev.committee,
        members: [...prev.committee.members, workerId],
        lastRotation: prev.committee.lastRotation || new Date().toISOString().split('T')[0],
      },
    }));
    addAdminAction(adminId, 'Committee Member Added', 'committee', '', workerId, 'New committee member');
    return true;
  }, [state.committee, persist, addAdminAction]);

  const removeCommitteeMember = useCallback((workerId, adminId) => {
    persist(prev => ({
      ...prev,
      committee: {
        ...prev.committee,
        members: prev.committee.members.filter(m => m !== workerId),
      },
    }));
    addAdminAction(adminId, 'Committee Member Removed', 'committee', workerId, '', 'Member removed');
  }, [persist, addAdminAction]);

  const addCommitteeDecision = useCallback((serviceId, decision, justification, decidedBy) => {
    const record = {
      id: genId('CDN'),
      serviceId,
      decision,
      justification,
      decidedBy,
      members: [...state.committee.members],
      timestamp: new Date().toISOString(),
    };
    persist(prev => ({
      ...prev,
      committee: {
        ...prev.committee,
        decisions: [...prev.committee.decisions, record],
      },
    }));
    addAudit('COMMITTEE_DECISION', decidedBy, 'committee', serviceId, '', decision, justification);
    return record;
  }, [state.committee, persist, addAudit]);

  /* ═══════════════════════════════════════════
     EMERGENCY ADJUSTMENTS
     ═══════════════════════════════════════════ */

  const createEmergencyAdjustment = useCallback((serviceId, adjustedPrice, reason, durationDays, adminId) => {
    const days = Math.min(durationDays, EMERGENCY_MAX_DAYS);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    const adjustment = {
      id: genId('EMG'),
      serviceId,
      adjustedPrice,
      reason,
      duration: days,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      status: 'active',
      autoReviewDate: end.toISOString().split('T')[0],
      createdBy: adminId,
      timestamp: new Date().toISOString(),
    };

    persist(prev => ({ ...prev, emergencyAdjustments: [...prev.emergencyAdjustments, adjustment] }));

    const band = state.priceBands[serviceId];
    addAudit('EMERGENCY_ADJUSTMENT', adminId, 'admin', serviceId, `₹${band?.reference || 0}`, `₹${adjustedPrice}`, `Emergency: ${reason} (${days} days)`);
    addAdminAction(adminId, 'Emergency Price Adjustment', 'pricing', `₹${band?.reference || 0}`, `₹${adjustedPrice} (${days}d)`, reason);

    return adjustment;
  }, [state.priceBands, persist, addAudit, addAdminAction]);

  const getActiveEmergency = useCallback((serviceId) => {
    return state.emergencyAdjustments.find(
      e => e.serviceId === serviceId && e.status === 'active' && new Date(e.endDate) > new Date()
    ) || null;
  }, [state.emergencyAdjustments]);

  const expireEmergencyAdjustment = useCallback((emergencyId, adminId) => {
    persist(prev => ({
      ...prev,
      emergencyAdjustments: prev.emergencyAdjustments.map(e =>
        e.id === emergencyId ? { ...e, status: 'expired' } : e
      ),
    }));
    addAudit('EMERGENCY_EXPIRED', adminId || 'SYSTEM', adminId ? 'admin' : 'system', null, 'active', 'expired', `Emergency ${emergencyId} ended`);
  }, [persist, addAudit]);

  /* ═══════════════════════════════════════════
     CARTEL DETECTION
     ═══════════════════════════════════════════ */

  const detectCartelPattern = useCallback((workerId, serviceId, proposedPrice) => {
    const recentProposals = state.proposals.filter(p => {
      const age = Date.now() - new Date(p.timestamp).getTime();
      return age < 7 * 24 * 60 * 60 * 1000; // last 7 days
    });

    const alerts = [];

    // Pattern: identical proposals from different workers
    const identicalCount = recentProposals.filter(
      p => p.serviceId === serviceId && p.proposedPrice === proposedPrice && p.workerId !== workerId
    ).length;
    if (identicalCount >= 2) {
      alerts.push({
        id: genId('CRT'),
        type: 'identical_proposals',
        description: `${identicalCount + 1} workers proposed identical price ₹${proposedPrice} for ${serviceId}`,
        severity: 'medium',
        serviceId,
        detectedAt: new Date().toISOString(),
        status: 'flagged',
      });
    }

    // Pattern: same worker submitting too frequently
    const workerRecent = recentProposals.filter(p => p.workerId === workerId).length;
    if (workerRecent >= 4) {
      alerts.push({
        id: genId('CRT'),
        type: 'high_frequency',
        description: `Worker ${workerId} submitted ${workerRecent + 1} proposals in 7 days`,
        severity: 'low',
        serviceId,
        detectedAt: new Date().toISOString(),
        status: 'flagged',
      });
    }

    // Pattern: coordinated price spike (>20% above reference from 3+ workers)
    const band = state.priceBands[serviceId];
    if (band) {
      const spikeThreshold = band.reference * 1.2;
      const spikeProposals = recentProposals.filter(
        p => p.serviceId === serviceId && p.proposedPrice > spikeThreshold
      );
      const uniqueWorkers = new Set(spikeProposals.map(p => p.workerId));
      if (proposedPrice > spikeThreshold) uniqueWorkers.add(workerId);
      if (uniqueWorkers.size >= 3) {
        alerts.push({
          id: genId('CRT'),
          type: 'coordinated_spike',
          description: `${uniqueWorkers.size} workers proposed >20% above reference for ${serviceId}`,
          severity: 'high',
          serviceId,
          detectedAt: new Date().toISOString(),
          status: 'flagged',
        });
      }
    }

    if (alerts.length > 0) {
      persist(prev => ({ ...prev, cartelAlerts: [...prev.cartelAlerts, ...alerts] }));
    }
  }, [state.proposals, state.priceBands, persist]);

  const getCartelAlerts = useCallback(() => state.cartelAlerts, [state.cartelAlerts]);

  const dismissCartelAlert = useCallback((alertId, adminId) => {
    persist(prev => ({
      ...prev,
      cartelAlerts: prev.cartelAlerts.map(a =>
        a.id === alertId ? { ...a, status: 'dismissed' } : a
      ),
    }));
    addAdminAction(adminId, 'Cartel Alert Dismissed', 'monitoring', alertId, 'dismissed', 'Alert reviewed and dismissed');
  }, [persist, addAdminAction]);

  /* ═══════════════════════════════════════════
     ALGORITHM VERSIONING
     ═══════════════════════════════════════════ */

  const getCurrentAlgorithm = useCallback(() => {
    return state.algorithmVersions[state.algorithmVersions.length - 1];
  }, [state.algorithmVersions]);

  const getAlgorithmHistory = useCallback(() => {
    return state.algorithmVersions;
  }, [state.algorithmVersions]);

  // Algorithm changes require audit — admin cannot secretly modify
  const updateAlgorithm = useCallback((newParams, changeSummary, reason, approver) => {
    const current = state.algorithmVersions[state.algorithmVersions.length - 1];
    const vParts = current.version.split('.');
    const newVersion = `${vParts[0]}.${parseInt(vParts[1]) + 1}`;

    const record = {
      version: newVersion,
      effectiveDate: new Date().toISOString().split('T')[0],
      changeSummary,
      reason,
      approver,
      parameters: { ...current.parameters, ...newParams },
    };

    persist(prev => ({ ...prev, algorithmVersions: [...prev.algorithmVersions, record] }));
    addAudit('ALGORITHM_UPDATE', approver, 'admin', null, `v${current.version}`, `v${newVersion}`, changeSummary);
    return record;
  }, [state.algorithmVersions, persist, addAudit]);

  /* ═══════════════════════════════════════════
     AUDIT TRAIL & ADMIN LOG (READ)
     ═══════════════════════════════════════════ */

  const getAuditTrail = useCallback((serviceId = null, limit = 50) => {
    let trail = [...state.auditTrail].reverse();
    if (serviceId) trail = trail.filter(a => a.serviceId === serviceId);
    return trail.slice(0, limit);
  }, [state.auditTrail]);

  const getAdminActionLog = useCallback((adminId = null, limit = 50) => {
    let log = [...state.adminActionLog].reverse();
    if (adminId) log = log.filter(a => a.adminId === adminId);
    return log.slice(0, limit);
  }, [state.adminActionLog]);

  /* ═══════════════════════════════════════════
     PRICING STATS
     ═══════════════════════════════════════════ */

  const getPricingStats = useMemo(() => {
    const activeProposals = state.proposals.filter(p => p.status === 'submitted').length;
    const pendingExceptions = state.exceptions.filter(e => e.status === 'pending_review' || e.status === 'under_review').length;
    const activeEmergencies = state.emergencyAdjustments.filter(e => e.status === 'active' && new Date(e.endDate) > new Date()).length;
    const unresolvedAlerts = state.cartelAlerts.filter(a => a.status === 'flagged').length;
    const totalFeedback = state.consumerFeedback.length;
    const totalAudit = state.auditTrail.length;

    return { activeProposals, pendingExceptions, activeEmergencies, unresolvedAlerts, totalFeedback, totalAudit };
  }, [state]);

  /* ═══════════════════════════════════════════
     CONTEXT VALUE
     ═══════════════════════════════════════════ */

  const value = useMemo(() => ({
    // Price Bands
    getPriceBand, getAllPriceBands, getApprovedPrice,
    updatePriceBand, updateFullPriceBand,
    // Fair Price Engine
    calculateFairRange,
    // Proposals
    submitProposal, getMyProposals, getAllProposals, getActiveProposals, updateProposalStatus,
    // Exceptions
    getAllExceptions, getPendingExceptions, reviewException, fourEyesApproveException,
    // Consumer Feedback
    addConsumerFeedback, getConsumerFeedbackStats,
    // Committee
    getCommittee, addCommitteeMember, removeCommitteeMember, addCommitteeDecision,
    // Emergency
    createEmergencyAdjustment, getActiveEmergency, expireEmergencyAdjustment,
    // Cartel
    getCartelAlerts, dismissCartelAlert,
    // Algorithm
    getCurrentAlgorithm, getAlgorithmHistory, updateAlgorithm,
    // Audit
    getAuditTrail, getAdminActionLog, addAudit, addAdminAction,
    // Stats
    pricingStats: getPricingStats,
  }), [
    getPriceBand, getAllPriceBands, getApprovedPrice,
    updatePriceBand, updateFullPriceBand,
    calculateFairRange,
    submitProposal, getMyProposals, getAllProposals, getActiveProposals, updateProposalStatus,
    getAllExceptions, getPendingExceptions, reviewException, fourEyesApproveException,
    addConsumerFeedback, getConsumerFeedbackStats,
    getCommittee, addCommitteeMember, removeCommitteeMember, addCommitteeDecision,
    createEmergencyAdjustment, getActiveEmergency, expireEmergencyAdjustment,
    getCartelAlerts, dismissCartelAlert,
    getCurrentAlgorithm, getAlgorithmHistory, updateAlgorithm,
    getAuditTrail, getAdminActionLog, addAudit, addAdminAction,
    getPricingStats,
  ]);

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) throw new Error('usePricing must be used within PricingProvider');
  return context;
}
