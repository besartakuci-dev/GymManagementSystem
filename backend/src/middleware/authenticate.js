import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
  }
}
