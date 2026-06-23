import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface JwtPayload {
  id: string;
  role: 'athlete' | 'employee' | 'admin';
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpires } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

/** Random URL-safe token for password reset links. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
