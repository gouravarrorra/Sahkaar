import { verifyToken } from '../config/jwt.js';
import prisma from '../config/db.js';

/**
 * Authentication middleware — extracts and validates JWT from Authorization header.
 * Attaches actor (id, role, communityId) to req.actor.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.actor = {
      id: payload.id,
      role: payload.role,
      communityId: payload.communityId || null,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role-based authorization middleware.
 * Usage: authorize('admin', 'reviewer')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.actor) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.actor.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Community isolation middleware.
 * Ensures admin/worker can only access their own community's data.
 * Attaches req.communityId from the authenticated actor's community.
 * NEVER trusts client-submitted community_id.
 */
export function communityGuard(req, res, next) {
  if (!req.actor) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.actor.communityId) {
    return res.status(403).json({ error: 'No community association' });
  }
  // Set the authoritative community ID from the server-side token
  req.communityId = req.actor.communityId;
  next();
}

export default { authenticate, authorize, communityGuard };
