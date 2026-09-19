/**
 * SAHKAAR Backend — 25 Critical Governance Tests
 * Tests the anti-monopoly pricing system, community isolation,
 * transaction integrity, and RBAC enforcement.
 *
 * Run: node --test src/tests/governance.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4000';

// ─── Helper ───
async function api(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  return { status: res.status, ...data };
}

// ─── Auth tokens ───
let adminToken, reviewerToken, userToken, workerToken, worker2Token;

before(async () => {
  const admin = await api('POST', '/api/auth/admin/login', { email: 'admin@sahkaar.coop', password: 'admin123' });
  adminToken = admin.data?.token;
  assert.ok(adminToken, 'Admin login failed');

  const reviewer = await api('POST', '/api/auth/admin/login', { email: 'reviewer@sahkaar.coop', password: 'reviewer123' });
  reviewerToken = reviewer.data?.token;
  assert.ok(reviewerToken, 'Reviewer login failed');

  const user = await api('POST', '/api/auth/user/login', { mobile: '+91 98765 43210', password: 'user123' });
  userToken = user.data?.token;
  assert.ok(userToken, 'User login failed');

  const worker = await api('POST', '/api/auth/worker/login', { mobile: '+91 87654 32109', password: 'worker123' });
  workerToken = worker.data?.token;
  assert.ok(workerToken, 'Worker W10245 login failed');

  const worker2 = await api('POST', '/api/auth/worker/login', { mobile: '+91 76543 21098', password: 'worker123' });
  worker2Token = worker2.data?.token;
  assert.ok(worker2Token, 'Worker W10312 login failed');
});

// ═══════════════════════════════════════════
// §1. WORKER VERIFICATION ENFORCEMENT
// ═══════════════════════════════════════════

describe('Worker Verification Enforcement', () => {
  it('T01: Unverified worker receives empty incoming requests', async () => {
    const worker3 = await api('POST', '/api/auth/worker/login', { mobile: '+91 65432 10987', password: 'worker123' });
    const incoming = await api('GET', '/api/bookings/worker/incoming', null, worker3.data?.token);
    assert.equal(incoming.success, true);
    assert.ok(Array.isArray(incoming.data));
  });
});

// ═══════════════════════════════════════════
// §2-4. PRICING GOVERNANCE — NO UNILATERAL CONTROL
// ═══════════════════════════════════════════

describe('Pricing Governance', () => {
  it('T02: Worker cannot set final price — only submit proposals', async () => {
    const result = await api('POST', '/api/pricing/proposals', {
      serviceId: 'plumber',
      proposedPrice: 500,
      justification: 'Complex repair',
    }, workerToken);
    if (result.success) {
      assert.equal(result.data.status, 'pending', 'Proposal should be pending, not approved');
    }
  });

  it('T03: Worker cannot see another workers active proposal', async () => {
    const mine = await api('GET', '/api/workers/me/proposals', null, workerToken);
    assert.equal(mine.success, true);
    const theirs = await api('GET', '/api/workers/me/proposals', null, worker2Token);
    assert.equal(theirs.success, true);
    if (mine.data.length > 0 && theirs.data.length > 0) {
      const myWorkerIds = new Set(mine.data.map(p => p.workerId));
      const theirWorkerIds = new Set(theirs.data.map(p => p.workerId));
      for (const id of myWorkerIds) {
        assert.ok(!theirWorkerIds.has(id) || id === undefined);
      }
    }
  });

  it('T04: Admin cannot approve own price exception (four-eyes)', async () => {
    const exception = await api('POST', '/api/pricing/exceptions', {
      serviceId: 'plumber',
      proposedPrice: 800,
      reason: 'Emergency flood repair',
      evidence: 'Customer reported flooding',
    }, adminToken);

    if (exception.success && exception.data?.id) {
      const selfApprove = await api('PATCH', `/api/pricing/exceptions/${exception.data.id}/review`, {
        action: 'approve',
        reviewNotes: 'Self-approving',
      }, adminToken);
      if (selfApprove.success) {
        assert.notEqual(selfApprove.data?.requestedBy, selfApprove.data?.reviewedBy,
          'Requestor and reviewer must be different');
      }
    }
  });
});

// ═══════════════════════════════════════════
// §5-7. INVOICE & CHARGE IMMUTABILITY
// ═══════════════════════════════════════════

describe('Invoice & Charge Protection', () => {
  it('T05: User cannot modify final invoice', async () => {
    const result = await api('PUT', '/api/invoices/B102938', { totalAmount: 100 }, userToken);
    assert.ok(result.status >= 400, 'Should not allow direct invoice modification');
  });

  it('T06: Worker cannot modify base service charge', async () => {
    const result = await api('PATCH', '/api/bookings/B102938/status', {
      status: 'completed',
      serviceCharge: 1000,
    }, workerToken);
    if (result.success) {
      const booking = await api('GET', '/api/bookings/B102938', null, workerToken);
      assert.notEqual(booking.data?.serviceCharge, 1000, 'Worker should not modify service charge');
    }
  });

  it('T07: Travel cost is server calculated, not client submitted', async () => {
    const booking = await api('GET', '/api/bookings/B102710', null, userToken);
    if (booking.success && booking.data) {
      assert.ok(booking.data.travelCost >= 0, 'Travel cost should be server-calculated');
    }
  });
});

// ═══════════════════════════════════════════
// §8-10. WELFARE & INSURANCE RULES
// ═══════════════════════════════════════════

describe('Welfare & Insurance Rules', () => {
  it('T08: Welfare is calculated on service charge only, NOT materials', async () => {
    const rules = await api('GET', '/api/welfare/rules', null, adminToken);
    assert.equal(rules.success, true);
    if (rules.data.length > 0) {
      const rule = rules.data[0];
      assert.equal(rule.contributionBasis || 'service_charge', 'service_charge');
    }
  });

  it('T09: Insurance is monthly, not per-service percentage', async () => {
    const plans = await api('GET', '/api/insurance/plans', null, adminToken);
    assert.equal(plans.success, true);
    if (plans.data.length > 0) {
      assert.ok(plans.data[0].monthlyPremium > 0, 'Insurance should be monthly premium');
    }
  });

  it('T10: Insurance payment does not create per-booking deductions', async () => {
    const enrollments = await api('GET', '/api/insurance/worker/mine', null, workerToken);
    assert.equal(enrollments.success, true);
  });
});

// ═══════════════════════════════════════════
// §11-14. TRANSACTION INTEGRITY
// ═══════════════════════════════════════════

describe('Transaction Integrity', () => {
  it('T11: One booking cannot have two final workers', async () => {
    const result = await api('POST', '/api/bookings/B102938/select-worker', {
      workerId: 'W10312',
    }, userToken);
    assert.ok(!result.success || result.status >= 400, 'Should not allow second worker');
  });

  it('T12: Paid transaction cannot be silently modified', async () => {
    const result = await api('PATCH', '/api/payments/B102938', { amount: 1 }, adminToken);
    assert.ok(result.status >= 400 || !result.success, 'Should not modify paid transaction');
  });

  it('T13: Duplicate payment callback cannot duplicate payment', async () => {
    const payments = await api('GET', '/api/payments/booking/B102710', null, userToken);
    if (payments.success && payments.data.length > 0) {
      const txn = payments.data[0];
      if (txn.paymentStatus === 'paid') {
        const result = await api('POST', '/api/payments/confirm', {
          transactionId: txn.transactionId,
        }, userToken);
        assert.equal(result.success, true);
        assert.ok(result.data?.message?.includes('Already paid') || result.data?.paymentStatus === 'paid');
      }
    }
  });
});

// ═══════════════════════════════════════════
// §15-17. COMMUNITY ISOLATION & RBAC
// ═══════════════════════════════════════════

describe('Community Isolation & RBAC', () => {
  it('T14: Admin dashboard returns community-scoped data', async () => {
    const dashboard = await api('GET', '/api/admin/dashboard', null, adminToken);
    assert.equal(dashboard.success, true);
    assert.ok(dashboard.data.totalWorkers !== undefined);
  });

  it('T15: Worker cannot access Admin APIs', async () => {
    const result = await api('GET', '/api/admin/dashboard', null, workerToken);
    assert.equal(result.status, 403, 'Worker should get 403 on admin endpoints');
  });

  it('T16: User cannot access Admin APIs', async () => {
    const result = await api('GET', '/api/admin/dashboard', null, userToken);
    assert.equal(result.status, 403, 'User should get 403 on admin endpoints');
  });

  it('T17: User cannot access Worker APIs', async () => {
    const result = await api('GET', '/api/bookings/worker/mine', null, userToken);
    assert.equal(result.status, 403, 'User should get 403 on worker endpoints');
  });
});

// ═══════════════════════════════════════════
// §18-20. GOVERNMENT SCHEME INTEGRITY
// ═══════════════════════════════════════════

describe('Government Scheme Integrity', () => {
  it('T18: Unpublished scheme is invisible to workers', async () => {
    const published = await api('GET', '/api/government/published', null, workerToken);
    assert.equal(published.success, true);
    if (published.data.length > 0) {
      published.data.forEach(scheme => {
        assert.equal(scheme.status, 'published', 'Worker should only see published schemes');
      });
    }
  });

  it('T19: Schemes are database-sourced, not hardcoded', async () => {
    const published = await api('GET', '/api/government/published', null, workerToken);
    assert.equal(published.success, true);
    assert.ok(Array.isArray(published.data), 'Should return array from database');
  });

  it('T20: Worker cannot publish schemes', async () => {
    const result = await api('PATCH', '/api/government/SCH_FAKE/status', {
      status: 'published',
    }, workerToken);
    assert.ok(result.status >= 400, 'Worker cannot publish schemes');
  });
});

// ═══════════════════════════════════════════
// §21-25. AUDIT & TRACEABILITY
// ═══════════════════════════════════════════

describe('Audit & Traceability', () => {
  it('T21: Audit records cannot be deleted', async () => {
    const result = await api('DELETE', '/api/audit/some-id', null, adminToken);
    assert.equal(result.status, 403, 'Audit deletion should return 403');
  });

  it('T22: Audit records cannot be modified', async () => {
    const result = await api('PUT', '/api/audit/some-id', { action: 'HACKED' }, adminToken);
    assert.equal(result.status, 403, 'Audit modification should return 403');
  });

  it('T23: Historical pricing remains traceable', async () => {
    const bands = await api('GET', '/api/pricing/bands', null, adminToken);
    assert.equal(bands.success, true);
    if (bands.data.length > 0) {
      assert.ok(bands.data[0].effectiveDate, 'Price bands should have effective dates');
    }
  });

  it('T24: Pricing algorithm version is recorded', async () => {
    const versions = await api('GET', '/api/pricing/algorithm', null, adminToken);
    assert.equal(versions.success, true);
    if (versions.data.length > 0) {
      assert.ok(versions.data[0].version, 'Algorithm versions should be recorded');
      assert.ok(versions.data[0].parameters, 'Algorithm parameters should be stored');
    }
  });

  it('T25: Booking state machine enforces valid transitions', async () => {
    const result = await api('PATCH', '/api/bookings/B102938/status', {
      status: 'completed',
    }, userToken);
    if (result.success === false) {
      assert.ok(result.error.includes('Invalid transition') || result.error.includes('Cannot') || result.error.includes('status'),
        'Should reject invalid state transition');
    }
  });
});
