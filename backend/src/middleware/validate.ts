import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Runs a set of express-validator chains and returns a consistent 422 error
 * shape if any fail. Used across all routes for efficient server-side validation.
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((c) => c.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: 'Neispravni podaci.',
        errors: errors.array().map((e) => ({
          field: (e as any).path,
          message: e.msg,
        })),
      });
    }
    next();
  };
}
