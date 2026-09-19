/**
 * Generate a prefixed unique ID.
 * E.g. genId('B') => 'B102938'
 */
export function genId(prefix = '') {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

/**
 * Generate a CUID for database records.
 */
export function cuid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Booking status state machine — valid transitions.
 */
export const BOOKING_STATUS_TRANSITIONS = {
  requested:        ['workers_notified', 'cancelled'],
  workers_notified: ['workers_accepting', 'cancelled'],
  workers_accepting:['worker_selected', 'cancelled'],
  worker_selected:  ['confirmed', 'cancelled'],
  confirmed:        ['on_the_way', 'cancelled'],
  on_the_way:       ['arrived'],
  arrived:          ['in_progress'],
  in_progress:      ['worker_done'],
  worker_done:      ['user_done', 'completed'],
  user_done:        ['completed'],
  completed:        ['invoiced'],
  invoiced:         ['payment_pending'],
  payment_pending:  ['paid'],
  paid:             ['rated'],
  rated:            [],
  cancelled:        [],
};

// Frontend-compatible aliases (maps frontend status names to canonical)
export const STATUS_ALIASES = {
  request_submitted: 'requested',
  working: 'in_progress',
};

/**
 * Validate a booking status transition.
 */
export function isValidTransition(fromStatus, toStatus) {
  const canonical = STATUS_ALIASES[fromStatus] || fromStatus;
  const allowed = BOOKING_STATUS_TRANSITIONS[canonical];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

/**
 * Valid booking statuses.
 */
export const ALL_BOOKING_STATUSES = Object.keys(BOOKING_STATUS_TRANSITIONS);
