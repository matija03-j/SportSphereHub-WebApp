import { Request, Response, NextFunction } from 'express';
import { User, Facility, Trainer } from '../models';
import { HttpError } from '../middleware/error';
import { userMap, display } from '../utils/users';

// ---------- Users ----------
export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, status } = req.query as Record<string, string>;
    const match: any = {};
    if (role) match.role = role;
    if (status) match.status = status;
    const users = await User.find(match).select('-passwordHash').lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, phone, email, status } = req.body;
    const update: any = { firstName, lastName, phone, email, status };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) throw new HttpError(404, 'Korisnik nije pronađen.');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'Korisnik nije pronađen.');
    if (user.role === 'admin') throw new HttpError(400, 'Administrator se ne može obrisati.');
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Korisnik je obrisan.' });
  } catch (err) {
    next(err);
  }
}

// ---------- Registration requests ----------
export async function pendingRequests(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find({ status: 'pending' }).select('-passwordHash').lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function decideRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { decision } = req.body; // 'approved' | 'rejected'
    const status = decision === 'approved' ? 'approved' : 'rejected';
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-passwordHash');
    if (!user) throw new HttpError(404, 'Zahtev nije pronađen.');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// ---------- Facility approvals ----------
export async function pendingFacilities(_req: Request, res: Response, next: NextFunction) {
  try {
    const facilities = await Facility.find({ status: 'pending' }).lean();
    // Resolve employee usernames -> full-name display objects.
    const map = await userMap(facilities.flatMap((f) => f.employees));
    res.json(
      facilities.map((f) => ({ ...f, employees: f.employees.map((u) => display(map, u)) }))
    );
  } catch (err) {
    next(err);
  }
}

export async function decideFacility(req: Request, res: Response, next: NextFunction) {
  try {
    const { decision } = req.body;
    if (decision === 'rejected') {
      await Facility.deleteOne({ _id: req.params.id });
      return res.json({ message: 'Objekat je odbijen i uklonjen.' });
    }
    const facility = await Facility.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!facility) throw new HttpError(404, 'Objekat nije pronađen.');
    res.json(facility);
  } catch (err) {
    next(err);
  }
}

// ---------- Trainers ----------
export async function listTrainers(_req: Request, res: Response, next: NextFunction) {
  try {
    const trainers = await Trainer.find()
      .populate('facility', 'name city')
      .lean();
    res.json(trainers);
  } catch (err) {
    next(err);
  }
}

export async function setTrainerActive(req: Request, res: Response, next: NextFunction) {
  try {
    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      { active: !!req.body.active },
      { new: true }
    );
    if (!trainer) throw new HttpError(404, 'Trener nije pronađen.');
    res.json(trainer);
  } catch (err) {
    next(err);
  }
}
