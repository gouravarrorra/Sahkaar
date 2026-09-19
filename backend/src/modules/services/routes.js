import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize, communityGuard } from '../../middleware/auth.js';
import { success, notFound, serverError } from '../../utils/response.js';

const router = Router();

// ─── GET all services (public) ───
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { status: 'active' },
      include: { subTypes: { where: { status: 'active' } } },
      orderBy: { name: 'asc' },
    });
    return success(res, services);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── GET single service ───
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: { subTypes: true },
    });
    if (!service) return notFound(res, 'Service');
    return success(res, service);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Create service ───
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id, name, label, icon, description, subTypes } = req.body;
    const service = await prisma.service.create({
      data: {
        id,
        name,
        label: label || name,
        icon: icon || '',
        description: description || '',
        subTypes: subTypes?.length ? {
          create: subTypes.map(st => ({ name: st.name || st })),
        } : undefined,
      },
      include: { subTypes: true },
    });
    return success(res, service, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

// ─── ADMIN: Update service ───
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, label, icon, description, status } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(label && { label }),
        ...(icon && { icon }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      include: { subTypes: true },
    });
    return success(res, service);
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
