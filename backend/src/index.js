import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Module routes
import authRoutes from './modules/auth/routes.js';
import serviceRoutes from './modules/services/routes.js';
import workerRoutes from './modules/workers/routes.js';
import userRoutes from './modules/users/routes.js';
import bookingRoutes from './modules/bookings/routes.js';
import invoiceRoutes from './modules/bookings/invoices.js';
import pricingRoutes from './modules/pricing/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import welfareRoutes from './modules/welfare/routes.js';
import insuranceRoutes from './modules/insurance/routes.js';
import certificationRoutes from './modules/certifications/routes.js';
import governmentRoutes from './modules/government/routes.js';
import trainingRoutes from './modules/training/routes.js';
import supportRoutes from './modules/support/routes.js';
import auditRoutes from './modules/audit/routes.js';
import analyticsRoutes from './modules/analytics/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import adminRoutes from './modules/admin/routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Core middleware ───
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Mount routes ───
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/welfare', welfareRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 handler ───
app.use('{*path}', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Global error handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ───
app.listen(PORT, () => {
  console.log(`\n🚀 SAHKAAR Backend running on http://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: POST /api/auth/{user,worker,admin}/login`);
  console.log(`💰 Pricing: /api/pricing/*`);
  console.log(`📦 Bookings: /api/bookings/*`);
  console.log(`\n`);
});

export default app;
