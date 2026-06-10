import { verifyToken } from '../utils/jwt.js';

// Soft authentication for public routes: if a valid Bearer token is present it
// populates req.user (so e.g. an admin can unlock extra data), but a missing or
// invalid token is NOT an error — the request proceeds anonymously.
// Contrast with `authenticate`, which rejects with 401 when the token is absent.
export function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(authHeader.slice(7));
      req.user = {
        userId: payload.sub,
        role: String(payload.role).toLowerCase(),
        email: payload.email,
      };
    } catch {
      // Ignore a bad/expired token on a public route — stay anonymous.
    }
  }
  next();
}
