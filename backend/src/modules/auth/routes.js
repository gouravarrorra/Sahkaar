import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { signToken } from '../../config/jwt.js';
import { validate } from '../../middleware/validate.js';
import { success, error, serverError } from '../../utils/response.js';
import { sendOTPEmail } from '../../services/email.js';

const router = Router();
const SALT_ROUNDS = 12;

// ═══════════════════════════════════════════
// OTP STORE (in-memory, dev-mode)
// Production: use Redis + real SMS/email service
// ═══════════════════════════════════════════

const otpStore = new Map(); // key → { otp, expiresAt, name? }
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOTP(key, otp, extra = {}) {
  otpStore.set(key, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS, ...extra });
}

function verifyOTP(key, otp) {
  const entry = otpStore.get(key);
  if (!entry) return { valid: false, reason: 'OTP not found. Please request a new one.' };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }
  if (entry.otp !== otp) return { valid: false, reason: 'Invalid OTP. Please try again.' };
  otpStore.delete(key);
  return { valid: true, data: entry };
}

// ═══════════════════════════════════════════
// USER AUTH — EMAIL OTP
// ═══════════════════════════════════════════

const emailOtpSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100).optional(),
});

// Send OTP to email
router.post('/user/email/send-otp', validate(emailOtpSchema), async (req, res) => {
  try {
    const { email, name } = req.validated;
    const otp = generateOTP();
    storeOTP(`email:${email}`, otp, { name });

    // Send real email via Resend
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      // Still allow login — OTP is stored, just log failure
    }

    return success(res, { message: 'OTP sent to email', email });
  } catch (err) {
    return serverError(res, err);
  }
});

// Verify email OTP → login or auto-register
router.post('/user/email/verify-otp', async (req, res) => {
  try {
    const { email, otp, language } = req.body;
    if (!email || !otp) return error(res, 'Email and OTP required');

    const result = verifyOTP(`email:${email}`, otp);
    if (!result.valid) return error(res, result.reason, 401);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const id = `U${Math.floor(10000 + Math.random() * 90000)}`;
      const displayName = result.data?.name || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          id,
          email,
          name: displayName,
          mobile: '', // Will be set later
          language: language || 'en',
        },
      });
    }

    const token = signToken({ id: user.id, role: 'user', communityId: user.communityId });

    return success(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, language: user.language },
      isNewUser: !user.mobile, // Flag if profile is incomplete
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ═══════════════════════════════════════════
// USER AUTH — PHONE OTP
// ═══════════════════════════════════════════

const phoneOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  name: z.string().min(2).max(100).optional(),
});

// Send OTP to phone
router.post('/user/phone/send-otp', validate(phoneOtpSchema), async (req, res) => {
  try {
    const { mobile, name } = req.validated;
    const otp = generateOTP();
    storeOTP(`phone:${mobile}`, otp, { name });

    // In production: send via SMS gateway (Twilio, MSG91, etc.)
    console.log(`\n📱 OTP for ${mobile}: ${otp}\n`);

    return success(res, { message: 'OTP sent to phone', mobile });
  } catch (err) {
    return serverError(res, err);
  }
});

// Verify phone OTP → login or auto-register
router.post('/user/phone/verify-otp', async (req, res) => {
  try {
    const { mobile, otp, language } = req.body;
    if (!mobile || !otp) return error(res, 'Mobile and OTP required');

    const result = verifyOTP(`phone:${mobile}`, otp);
    if (!result.valid) return error(res, result.reason, 401);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      const id = `U${Math.floor(10000 + Math.random() * 90000)}`;
      const displayName = result.data?.name || 'User';
      user = await prisma.user.create({
        data: {
          id,
          mobile,
          name: displayName,
          language: language || 'en',
        },
      });
    }

    const token = signToken({ id: user.id, role: 'user', communityId: user.communityId });

    return success(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, language: user.language },
      isNewUser: !user.email, // Flag if profile is incomplete
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ═══════════════════════════════════════════
// LEGACY: USER LOGIN/REGISTER (password-based, kept for backward compat)
// ═══════════════════════════════════════════

const userRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().min(10).max(15),
  password: z.string().min(6).max(100),
  language: z.string().default('en'),
});

const userLoginSchema = z.object({
  mobile: z.string().min(10),
  password: z.string().min(1),
});

router.post('/user/register', validate(userRegisterSchema), async (req, res) => {
  try {
    const { name, mobile, password, language } = req.validated;
    const existing = await prisma.user.findUnique({ where: { mobile } });
    if (existing) return error(res, 'Mobile number already registered', 409);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = `U${Math.floor(10000 + Math.random() * 90000)}`;

    const user = await prisma.user.create({
      data: { id, name, mobile, passwordHash, language },
    });

    const token = signToken({ id: user.id, role: 'user', communityId: null });
    return success(res, {
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile, language: user.language },
    }, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

router.post('/user/login', validate(userLoginSchema), async (req, res) => {
  try {
    const { mobile, password } = req.validated;
    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) return error(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return error(res, 'Invalid credentials', 401);

    const token = signToken({ id: user.id, role: 'user', communityId: user.communityId });
    return success(res, {
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile, language: user.language },
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ═══════════════════════════════════════════
// WORKER AUTH
// ═══════════════════════════════════════════

const workerRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().min(10).max(15),
  email: z.string().email().optional().default(''),
  password: z.string().min(6).max(100),
  communityId: z.string().min(1),
  skills: z.array(z.string()).min(1),
  baseLocation: z.string().optional().default(''),
});

const workerLoginSchema = z.object({
  mobile: z.string().min(10),
  password: z.string().min(1),
});

router.post('/worker/register', validate(workerRegisterSchema), async (req, res) => {
  try {
    const { name, mobile, email, password, communityId, skills, baseLocation } = req.validated;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return error(res, 'Invalid community ID', 400);

    const existing = await prisma.worker.findUnique({ where: { mobile } });
    if (existing) return error(res, 'Mobile number already registered', 409);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = `W${Math.floor(10000 + Math.random() * 90000)}`;

    const worker = await prisma.$transaction(async (tx) => {
      const w = await tx.worker.create({
        data: {
          id,
          communityId,
          name,
          mobile,
          email,
          passwordHash,
          baseLocation,
          verificationStatus: 'pending_verification',
        },
      });

      for (const skillId of skills) {
        const service = await tx.service.findUnique({ where: { id: skillId } });
        if (service) {
          await tx.workerSkill.create({
            data: { workerId: w.id, serviceId: skillId },
          });
        }
      }

      return w;
    });

    const token = signToken({ id: worker.id, role: 'worker', communityId });

    return success(res, {
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        mobile: worker.mobile,
        verificationStatus: worker.verificationStatus,
      },
    }, 201);
  } catch (err) {
    return serverError(res, err);
  }
});

router.post('/worker/login', validate(workerLoginSchema), async (req, res) => {
  try {
    const { mobile, password } = req.validated;
    const worker = await prisma.worker.findUnique({ where: { mobile } });
    if (!worker) return error(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, worker.passwordHash);
    if (!valid) return error(res, 'Invalid credentials', 401);

    const token = signToken({ id: worker.id, role: 'worker', communityId: worker.communityId });

    return success(res, {
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        mobile: worker.mobile,
        communityId: worker.communityId,
        verificationStatus: worker.verificationStatus,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ═══════════════════════════════════════════
// ADMIN AUTH
// ═══════════════════════════════════════════

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/admin/login', validate(adminLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.validated;
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return error(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return error(res, 'Invalid credentials', 401);

    const token = signToken({ id: admin.id, role: admin.role, communityId: admin.communityId });

    return success(res, {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        communityId: admin.communityId,
      },
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ═══════════════════════════════════════════
// GET CURRENT USER (from token)
// ═══════════════════════════════════════════

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return error(res, 'Not authenticated', 401);

  try {
    const { verifyToken } = await import('../../config/jwt.js');
    const payload = verifyToken(header.slice(7));

    if (payload.role === 'user') {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) return error(res, 'User not found', 404);
      return success(res, { role: 'user', user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, language: user.language } });
    }
    if (payload.role === 'worker') {
      const worker = await prisma.worker.findUnique({
        where: { id: payload.id },
        include: { skills: { include: { service: true } }, certifications: true },
      });
      if (!worker) return error(res, 'Worker not found', 404);
      return success(res, { role: 'worker', worker });
    }
    if (payload.role === 'admin' || payload.role === 'reviewer' || payload.role === 'auditor') {
      const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
      if (!admin) return error(res, 'Admin not found', 404);
      return success(res, { role: payload.role, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, communityId: admin.communityId } });
    }

    return error(res, 'Unknown role', 400);
  } catch {
    return error(res, 'Invalid token', 401);
  }
});

export default router;

