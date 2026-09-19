import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { success, error, notFound, serverError } from '../../utils/response.js';
import { createNotification } from '../notifications/routes.js';

const router = Router();

/* ═══════════════════════════════════════════
   GOVERNMENT SCHEMES (Admin-managed, NO fake data)
   ═══════════════════════════════════════════ */

// WORKER/PUBLIC: Get published schemes only
router.get('/published', authenticate, async (req, res) => {
  try {
    // Workers only see PUBLISHED, non-archived schemes
    const schemes = await prisma.governmentScheme.findMany({
      where: { status: 'published', isArchived: false },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsed = schemes.map(s => ({
      ...s,
      targetCategories: JSON.parse(s.targetCategories || '[]'),
      eligibilityCriteria: JSON.parse(s.eligibilityCriteria || '[]'),
      benefits: JSON.parse(s.benefits || '[]'),
      requiredDocuments: JSON.parse(s.requiredDocuments || '[]'),
    }));

    return success(res, parsed);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Get all schemes (community-scoped)
router.get('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const schemes = await prisma.governmentScheme.findMany({
      where: { communityId: req.communityId },
      orderBy: { createdAt: 'desc' },
    });
    const parsed = schemes.map(s => ({
      ...s,
      targetCategories: JSON.parse(s.targetCategories || '[]'),
      eligibilityCriteria: JSON.parse(s.eligibilityCriteria || '[]'),
      benefits: JSON.parse(s.benefits || '[]'),
      requiredDocuments: JSON.parse(s.requiredDocuments || '[]'),
    }));
    return success(res, parsed);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Create scheme
router.post('/', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const data = req.body;
    const id = `SCH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const scheme = await prisma.governmentScheme.create({
      data: {
        id,
        communityId: req.communityId,
        schemeName: data.schemeName || '',
        shortDescription: data.shortDescription || '',
        fullDescription: data.fullDescription || '',
        department: data.department || '',
        schemeType: data.schemeType || '',
        coverImage: data.coverImage || '',
        officialUrl: data.officialUrl || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        eligibilityDescription: data.eligibilityDescription || '',
        targetCategories: JSON.stringify(data.targetCategories || []),
        eligibilityCriteria: JSON.stringify(data.eligibilityCriteria || []),
        ageMin: data.ageMin || '',
        ageMax: data.ageMax || '',
        incomeCategory: data.incomeCategory || '',
        otherEligibility: data.otherEligibility || '',
        benefits: JSON.stringify(data.benefits || []),
        requiredDocuments: JSON.stringify(data.requiredDocuments || []),
        applicationProcess: data.applicationProcess || '',
        applicationInstructions: data.applicationInstructions || '',
        applicationLink: data.applicationLink || '',
        contactInfo: data.contactInfo || '',
        importantNotes: data.importantNotes || '',
        status: data.status || 'draft',
        createdByAdminId: req.actor.id,
      },
    });

    return success(res, scheme, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Update scheme
router.put('/:id', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const existing = await prisma.governmentScheme.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!existing) return notFound(res, 'Scheme');

    const data = req.body;
    const scheme = await prisma.governmentScheme.update({
      where: { id: existing.id },
      data: {
        ...(data.schemeName !== undefined && { schemeName: data.schemeName }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.fullDescription !== undefined && { fullDescription: data.fullDescription }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.schemeType !== undefined && { schemeType: data.schemeType }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.officialUrl !== undefined && { officialUrl: data.officialUrl }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.eligibilityDescription !== undefined && { eligibilityDescription: data.eligibilityDescription }),
        ...(data.targetCategories && { targetCategories: JSON.stringify(data.targetCategories) }),
        ...(data.eligibilityCriteria && { eligibilityCriteria: JSON.stringify(data.eligibilityCriteria) }),
        ...(data.benefits && { benefits: JSON.stringify(data.benefits) }),
        ...(data.requiredDocuments && { requiredDocuments: JSON.stringify(data.requiredDocuments) }),
        ...(data.applicationProcess !== undefined && { applicationProcess: data.applicationProcess }),
        ...(data.applicationInstructions !== undefined && { applicationInstructions: data.applicationInstructions }),
        ...(data.applicationLink !== undefined && { applicationLink: data.applicationLink }),
        ...(data.contactInfo !== undefined && { contactInfo: data.contactInfo }),
        ...(data.importantNotes !== undefined && { importantNotes: data.importantNotes }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
        updatedByAdminId: req.actor.id,
      },
    });

    return success(res, scheme);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Publish/unpublish/archive
router.patch('/:id/status', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { status, isArchived } = req.body;
    const existing = await prisma.governmentScheme.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!existing) return notFound(res, 'Scheme');

    const scheme = await prisma.governmentScheme.update({
      where: { id: existing.id },
      data: {
        ...(status && { status }),
        ...(isArchived !== undefined && { isArchived }),
        updatedByAdminId: req.actor.id,
      },
    });

    // Notify workers when scheme is published
    if (status === 'published') {
      const workers = await prisma.worker.findMany({
        where: { communityId: req.communityId, verificationStatus: 'approved' },
        select: { id: true },
      });
      for (const w of workers) {
        createNotification({
          workerId: w.id,
          type: 'scheme',
          title: 'New Government Scheme Available',
          body: `"${scheme.schemeName}" is now available. Check eligibility and apply.`,
          communityId: req.communityId,
        }).catch(() => {});
      }
    }

    return success(res, scheme);
  } catch (err) {
    return serverError(res, err);
  }
});

// GET single scheme
router.get('/:id', authenticate, async (req, res) => {
  try {
    const scheme = await prisma.governmentScheme.findUnique({
      where: { id: req.params.id },
    });
    if (!scheme) return notFound(res, 'Scheme');

    // Workers can only see published schemes
    if (req.actor.role === 'worker' && scheme.status !== 'published') {
      return notFound(res, 'Scheme');
    }

    return success(res, {
      ...scheme,
      targetCategories: JSON.parse(scheme.targetCategories || '[]'),
      eligibilityCriteria: JSON.parse(scheme.eligibilityCriteria || '[]'),
      benefits: JSON.parse(scheme.benefits || '[]'),
      requiredDocuments: JSON.parse(scheme.requiredDocuments || '[]'),
    });
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   SCHEME APPLICATIONS
   ═══════════════════════════════════════════ */

// WORKER: Apply to scheme
router.post('/applications', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { schemeId } = req.body;
    if (!schemeId) return error(res, 'schemeId required');

    const scheme = await prisma.governmentScheme.findFirst({
      where: { id: schemeId, status: 'published', isArchived: false },
    });
    if (!scheme) return notFound(res, 'Published scheme');

    // Check existing application
    const existing = await prisma.schemeApplication.findFirst({
      where: { schemeId, workerId: req.actor.id },
    });
    if (existing) return success(res, existing);

    const appId = `APP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const app = await prisma.schemeApplication.create({
      data: {
        id: appId,
        schemeId,
        workerId: req.actor.id,
        communityId: scheme.communityId,
        applicationStatus: 'application_started',
      },
    });

    return success(res, app, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// WORKER: Get my applications
router.get('/applications/mine', authenticate, authorize('worker'), async (req, res) => {
  try {
    const apps = await prisma.schemeApplication.findMany({
      where: { workerId: req.actor.id },
      include: { scheme: true },
      orderBy: { submittedAt: 'desc' },
    });
    return success(res, apps);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Get all applications (community-scoped)
router.get('/applications', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const apps = await prisma.schemeApplication.findMany({
      where: { communityId: req.communityId },
      include: {
        scheme: { select: { id: true, schemeName: true } },
        worker: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return success(res, apps);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADMIN: Update application status
router.patch('/applications/:id/status', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const app = await prisma.schemeApplication.findFirst({
      where: { id: req.params.id, communityId: req.communityId },
    });
    if (!app) return notFound(res, 'Application');

    const updated = await prisma.schemeApplication.update({
      where: { id: app.id },
      data: {
        applicationStatus: status,
        ...(adminNotes !== undefined && { adminNotes }),
      },
    });

    // Notify worker about status change
    createNotification({
      workerId: app.workerId,
      type: 'scheme',
      title: 'Scheme Application Update',
      body: `Your scheme application status has been updated to: ${status}.`,
      communityId: req.communityId,
    }).catch(() => {});

    return success(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

/* ═══════════════════════════════════════════
   GOVERNMENT REQUIREMENTS (future-ready)
   ═══════════════════════════════════════════ */

router.get('/requirements', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const reqs = await prisma.governmentRequirement.findMany({
      where: { communityId: req.communityId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, reqs);
  } catch (err) {
    return serverError(res, err);
  }
});

router.post('/requirements', authenticate, authorize('admin'), communityGuard, async (req, res) => {
  try {
    const { skill, quantity, location, requiredDate, qualification } = req.body;
    const requirement = await prisma.governmentRequirement.create({
      data: {
        communityId: req.communityId,
        skill: skill || '',
        quantity: quantity || 0,
        location: location || '',
        requiredDate: requiredDate || '',
        qualification: qualification || '',
      },
    });
    return success(res, requirement, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
