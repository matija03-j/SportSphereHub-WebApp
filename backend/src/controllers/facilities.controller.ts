import { Request, Response, NextFunction } from 'express';
import { Facility, Promotion, Review, Reservation } from '../models';
import { HttpError } from '../middleware/error';
import { userMap, display } from '../utils/users';

/** Home page data for unregistered users: active count, TOP 3 by likes, current promotions. */
export async function homeInfo(_req: Request, res: Response, next: NextFunction) {
  try {
    const activeCount = await Facility.countDocuments({ status: 'approved' });

    const top3 = await Facility.aggregate([
      { $match: { status: 'approved' } },
      { $addFields: { likeCount: { $size: { $ifNull: ['$likes', []] } } } },
      { $sort: { likeCount: -1 } },
      { $limit: 3 },
      { $project: { name: 1, city: 1, likeCount: 1, images: 1 } },
    ]);

    const now = new Date();
    const promotions = await Promotion.find({ startDate: { $lte: now }, endDate: { $gte: now } })
      .sort({ endDate: 1 })
      .limit(3)
      .populate('facility', 'name')
      .lean();

    res.json({ activeCount, top3, promotions });
  } catch (err) {
    next(err);
  }
}

/** Distinct cities that have at least one approved facility (for the search dropdown). */
export async function activeCities(_req: Request, res: Response, next: NextFunction) {
  try {
    const cities = await Facility.distinct('city', { status: 'approved' });
    res.json(cities.sort());
  } catch (err) {
    next(err);
  }
}

/** Public search over approved facilities. Filters: name, city, sport, type. */
export async function searchFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, city, sport, type } = req.query as Record<string, string>;
    const match: any = { status: 'approved' };
    if (name) match.name = { $regex: name, $options: 'i' };
    if (city) match.city = city;
    if (sport) match.sports = sport;

    let facilities = await Facility.find(match).lean();

    // Filter by court type (otvoreni = open / zatvoreni = closed or hall).
    if (type === 'open' || type === 'closed') {
      facilities = facilities.filter((f) =>
        (f.resources || []).some((r: any) =>
          type === 'open' ? r.type === 'open' : r.type === 'closed' || r.type === 'hall'
        )
      );
    }

    // "samo slobodni termini danas": keep facilities that still have a free
    // full-hour slot today within working hours, on any resource.
    if ((req.query.freeToday as string) === '1') {
      const now = new Date();
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
      const ids = facilities.map((f) => f._id);
      const todays = await Reservation.find({
        facility: { $in: ids },
        status: { $ne: 'cancelled' },
        start: { $gte: dayStart, $lte: dayEnd },
      }).lean();

      facilities = facilities.filter((f: any) => {
        const [openH] = f.workingHours.open.split(':').map(Number);
        const [closeH] = f.workingHours.close.split(':').map(Number);
        const fromHour = Math.max(openH, now.getHours() + 1);
        return (f.resources || []).some((r: any) => {
          for (let h = fromHour; h < closeH; h++) {
            const slotStart = new Date(now); slotStart.setHours(h, 0, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + 3600 * 1000);
            const taken = todays.some(
              (t: any) => String(t.resourceId) === String(r._id) && t.start < slotEnd && t.end > slotStart
            );
            if (!taken) return true;
          }
          return false;
        });
      });
    }

    const result = facilities.map((f) => ({
      ...f,
      likeCount: (f.likes || []).length,
      dislikeCount: (f.dislikes || []).length,
      sportNames: f.sports, // already names
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** Facility details (only approved facilities are publicly visible). */
export async function facilityDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const facility = await Facility.findOne({ _id: req.params.id, status: 'approved' }).lean();
    if (!facility) throw new HttpError(404, 'Objekat nije pronađen.');

    const reviews = await Review.find({ facility: facility._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const map = await userMap(reviews.map((r) => r.user));
    const recentReviews = reviews.map((r) => ({ ...r, user: display(map, r.user) }));

    res.json({
      ...facility,
      likeCount: (facility.likes || []).length,
      dislikeCount: (facility.dislikes || []).length,
      recentReviews,
    });
  } catch (err) {
    next(err);
  }
}
