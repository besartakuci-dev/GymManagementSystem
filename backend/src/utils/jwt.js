import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: config.JWT_ISSUER,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET, {
    issuer: config.JWT_ISSUER,
    algorithms: ['HS256'],
  });
}
