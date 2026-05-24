import { ApiError } from '../utils/ApiError.js';

export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
