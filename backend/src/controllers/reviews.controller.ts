import { Request, Response, NextFunction } from 'express';
import { Review, Reservation, Facility } from '../models';
import { HttpError } from '../middleware/error';

/**
 * Athlete leaves a like/dislike + comment for a facility.
 * Rules: requires >= 1 confirmed reservation there, and the number of reviews
 * by the user must not exceed their confirmed-reservation count at that facility.
 */
export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { facility: facilityId, reaction, comment } = req.body;
    if (!['like', 'dislike'].includes(reaction)) throw new HttpError(422, 'Neispravna reakcija.');

    const facility = await Facility.findById(facilityId);
    if (!facility) throw new HttpError(404, 'Objekat nije pronađen.');

    const username = req.user!.username;
    const confirmedCount = await Reservation.countDocuments({
      facility: facilityId,
      user: username,
      status: { $in: ['confirmed', 'completed'] },
    });
    if (confirmedCount === 0) {
      throw new HttpError(403, 'Možete oceniti objekat samo ako ste imali potvrđenu rezervaciju.');
    }
    const existingReviews = await Review.countDocuments({ facility: facilityId, user: username });
    if (existingReviews >= confirmedCount) {
      throw new HttpError(403, 'Iskoristili ste sve dozvoljene ocene za ovaj objekat.');
    }

    const review = await Review.create({ user: username, facility: facilityId, reaction, comment: comment || '' });

    // Keep the facility's like/dislike sets (used by TOP-3) consistent.
    if (reaction === 'like') {
      await Facility.updateOne({ _id: facilityId }, { $addToSet: { likes: username }, $pull: { dislikes: username } });
    } else {
      await Facility.updateOne({ _id: facilityId }, { $addToSet: { dislikes: username }, $pull: { likes: username } });
    }

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

/** Facilities where the athlete may review (has confirmed reservations) + remaining quota. */
export async function reviewableFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.user!.username;
    const confirmed = await Reservation.aggregate([
      { $match: { user: username, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$facility', count: { $sum: 1 } } },
    ]);
    const result = [];
    for (const c of confirmed) {
      const used = await Review.countDocuments({ facility: c._id, user: username });
      const facility = await Facility.findById(c._id).select('name city').lean();
      if (facility) result.push({ facility, confirmed: c.count, used, remaining: c.count - used });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}
