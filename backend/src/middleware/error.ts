import { Request, Response, NextFunction } from 'express';

/** Thrown by controllers/services to signal an HTTP error with a status code. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Ruta nije pronađena.' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError ? err.status : err.status || 500;
  if (status >= 500) console.error(err);
  // Mongo duplicate-key error -> friendly message
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'vrednost';
    return res.status(409).json({ message: `Već postoji zapis sa istom vrednošću (${field}).` });
  }
  res.status(status).json({ message: err.message || 'Došlo je do greške na serveru.' });
}
