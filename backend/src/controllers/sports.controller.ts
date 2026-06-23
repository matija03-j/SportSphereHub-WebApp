import { Request, Response, NextFunction } from 'express';
import { Sport } from '../models';
import { HttpError } from '../middleware/error';

export async function listSports(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await Sport.find().sort({ name: 1 }).lean());
  } catch (err) {
    next(err);
  }
}

export async function createSport(req: Request, res: Response, next: NextFunction) {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) throw new HttpError(422, 'Naziv sporta je obavezan.');
    const sport = await Sport.create({ name });
    res.status(201).json(sport);
  } catch (err) {
    next(err);
  }
}
