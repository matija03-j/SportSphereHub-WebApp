import { Request, Response, NextFunction } from 'express';
import { Trainer, Training } from '../models';
import { HttpError } from '../middleware/error';
import { isOnTheHour } from '../utils/dates';

/** Browse trainers, optionally filtered by facility / sport, with average rating. */
export async function listTrainers(req: Request, res: Response, next: NextFunction) {
  try {
    const { facility, sport } = req.query as Record<string, string>;
    const match: any = { active: true };
    if (facility) match.facility = facility;
    if (sport) match.sport = sport;
    const trainers = await Trainer.find(match)
      .populate('facility', 'name city')
      .lean();
    res.json(trainers);
  } catch (err) {
    next(err);
  }
}

export async function myTrainings(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await Training.find({ user: req.user!.username })
      .sort({ start: -1 })
      .populate('trainer', 'name specialization')
      .populate('facility', 'name city')
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function bookTraining(req: Request, res: Response, next: NextFunction) {
  try {
    const { trainer: trainerId, start, durationHours } = req.body;
    const trainer = await Trainer.findOne({ _id: trainerId, active: true });
    if (!trainer) throw new HttpError(404, 'Trener nije pronađen.');
    const startDate = new Date(start);
    if (isNaN(startDate.getTime()) || !isOnTheHour(startDate)) {
      throw new HttpError(422, 'Termin mora počinjati na pun sat.');
    }
    if (startDate.getTime() < Date.now()) throw new HttpError(422, 'Termin je u prošlosti.');
    const dur = Number(durationHours) || 1;
    const training = await Training.create({
      trainer: trainer._id,
      user: req.user!.username,
      facility: trainer.facility,
      sport: trainer.sport,
      start: startDate,
      end: new Date(startDate.getTime() + dur * 3600 * 1000),
      status: 'scheduled',
    });
    res.status(201).json(training);
  } catch (err) {
    next(err);
  }
}
