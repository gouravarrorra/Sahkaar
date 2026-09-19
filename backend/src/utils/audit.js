import prisma from '../config/db.js';

/**
 * Create an immutable audit log entry.
 * This is the backend enforcement of audit trail — cannot be deleted by normal Admin APIs.
 */
export async function createAuditLog({
  communityId,
  actorId,
  actorRole,
  action,
  entityType = '',
  entityId = '',
  previousValue = '',
  newValue = '',
  reason = '',
  ipAddress = '',
}) {
  return prisma.auditLog.create({
    data: {
      communityId,
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      previousValue: String(previousValue),
      newValue: String(newValue),
      reason,
      ipAddress,
    },
  });
}

/**
 * Create an admin action log entry.
 */
export async function createAdminActionLog({
  communityId,
  adminId,
  action,
  category = '',
  previousValue = '',
  newValue = '',
  reason = '',
}) {
  return prisma.adminActionLog.create({
    data: {
      communityId,
      adminId,
      action,
      category,
      previousValue: String(previousValue),
      newValue: String(newValue),
      reason,
    },
  });
}
