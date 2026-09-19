import { z } from 'zod';

/**
 * Zod validation middleware factory.
 * Usage: validate(schema) — validates req.body against the zod schema.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.validated = result.data;
    next();
  };
}

/**
 * Query parameter validation.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

export default { validate, validateQuery };
