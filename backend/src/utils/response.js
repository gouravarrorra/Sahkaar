/**
 * Standard API response helpers.
 */
export function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function created(res, data) {
  return success(res, data, 201);
}

export function error(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

export function notFound(res, entity = 'Resource') {
  return error(res, `${entity} not found`, 404);
}

export function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

export function serverError(res, err) {
  console.error('Server error:', err);
  return error(res, 'Internal server error', 500);
}
