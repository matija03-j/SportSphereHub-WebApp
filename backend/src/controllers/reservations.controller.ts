import { Request, Response, NextFunction } from 'express';
import { Reservation, Facility } from '../models';
import { HttpError } from '../middleware/error';
import { canCancel, isOnTheHour, overlaps } from '../utils/dates';

/** Athlete's own reservations (newest first), with names populated for the table. */
export async function myReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await Reservation.find({ user: req.user!.username })
      .sort({ start: -1 })
      .populate('facility', 'name city resources')
      .lean();
    const shaped = list.map((r) => {
      const fac: any = r.facility;
      const resource = fac?.resources?.find((x: any) => String(x._id) === String(r.resourceId));
      return {
        ...r,
        facilityName: fac?.name,
        city: fac?.city,
        resourceName: resource?.name,
        sportName: r.sport, // sport name string
      };
    });
    res.json(shaped);
  } catch (err) {
    next(err);
  }
}

/** Reservations for a resource in a date range (for the weekly calendar). */
export async function resourceAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { facility, resourceId, from, to } = req.query as Record<string, string>;
    const list = await Reservation.find({
      facility,
      resourceId,
      status: { $ne: 'cancelled' },
      start: { $gte: new Date(from), $lt: new Date(to) },
    })
      .select('start end status user')
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

/** Create a reservation enforcing all booking rules server-side. */
export async function createReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const { facility: facilityId, resourceId, sport, start, durationHours } = req.body;
    const dur = Number(durationHours) || 1;
    if (dur < 1 || !Number.isInteger(dur)) {
      throw new HttpError(422, 'Najmanja jedinica je 1 sat (ceo broj sati).');
    }
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) throw new HttpError(422, 'Neispravan termin.');
    if (!isOnTheHour(startDate)) throw new HttpError(422, 'Termin mora počinjati na pun sat.');
    const endDate = new Date(startDate.getTime() + dur * 3600 * 1000);
    if (startDate.getTime() < Date.now()) throw new HttpError(422, 'Termin je u prošlosti.');

    const facility = await Facility.findOne({ _id: facilityId, status: 'approved' });
    if (!facility) throw new HttpError(404, 'Objekat nije pronađen.');
    const resource = facility.resources.id(resourceId);
    if (!resource) throw new HttpError(404, 'Teren/hala nije pronađen.');

    // Working hours.
    const [openH] = facility.workingHours.open.split(':').map(Number);
    const [closeH] = facility.workingHours.close.split(':').map(Number);
    if (startDate.getHours() < openH || endDate.getHours() > closeH) {
      throw new HttpError(422, `Termin mora biti u okviru radnog vremena (${facility.workingHours.open}–${facility.workingHours.close}).`);
    }

    // No-show block.
    const noShows = await Reservation.countDocuments({
      facility: facilityId,
      user: req.user!.username,
      status: 'no_show',
    });
    if (noShows >= facility.maxNoShows) {
      throw new HttpError(403, 'Blokirani ste za rezervacije u ovom objektu zbog nedolazaka.');
    }

    // Overlap check on the same resource.
    const existing = await Reservation.find({
      facility: facilityId,
      resourceId,
      status: { $ne: 'cancelled' },
      start: { $lt: endDate },
      end: { $gt: startDate },
    }).lean();
    if (existing.some((e) => overlaps(startDate, endDate, e.start, e.end))) {
      throw new HttpError(409, 'Termin je već zauzet.');
    }

    const reservation = await Reservation.create({
      facility: facilityId,
      resourceId,
      user: req.user!.username,
      sport: sport || resource.sport,
      start: startDate,
      end: endDate,
      status: 'pending',
    });
    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
}

/** Athlete cancels their reservation (only if it starts >= 12h away). */
export async function cancelReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user!.username });
    if (!reservation) throw new HttpError(404, 'Rezervacija nije pronađena.');
    if (['cancelled', 'completed', 'no_show'].includes(reservation.status)) {
      throw new HttpError(400, 'Rezervacija se ne može otkazati.');
    }
    if (!canCancel(reservation.start)) {
      throw new HttpError(400, 'Otkazivanje je moguće samo 12 i više sati pre termina.');
    }
    reservation.status = 'cancelled';
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}
