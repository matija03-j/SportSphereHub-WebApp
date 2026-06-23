import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { publicUser } from './auth.controller';
import { HttpError } from '../middleware/error';

/** Current user's profile. */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await publicUser(req.user!.id));
  } catch (err) {
    next(err);
  }
}

/** Update own profile (username cannot change). */
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, phone, email } = req.body;
    let sports = req.body.sports;
    if (sports) {
      sports = Array.isArray(sports) ? sports : JSON.parse(sports);
      if (sports.length > 5) throw new HttpError(422, 'Najviše 5 sportova.');
    }
    const update: any = { firstName, lastName, phone, email };
    if (sports) update.sports = sports;
    if (req.file) update.profileImage = `/uploads/${req.file.filename}`;
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    await User.updateOne({ _id: req.user!.id }, update);
    res.json(await publicUser(req.user!.id));
  } catch (err) {
    next(err);
  }
}
