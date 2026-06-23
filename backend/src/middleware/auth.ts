import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Requires a valid Bearer token; attaches the payload to req.user. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Niste prijavljeni.' });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ message: 'Token nije validan ili je istekao.' });
  }
}

/** Requires the authenticated user to hold one of the given roles. */
export function requireRole(...roles: Array<JwtPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Niste prijavljeni.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Nemate dozvolu za ovu akciju.' });
    }
    next();
  };
}
