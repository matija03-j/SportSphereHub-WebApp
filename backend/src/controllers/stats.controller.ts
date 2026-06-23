import { Request, Response, NextFunction } from 'express';
import { Reservation, Order } from '../models';

/**
 * Athlete statistics:
 *  - reservations per sport (bar chart)
 *  - monthly activity trend (line)
 *  - total equipment spend across ALL athletes (spec requirement)
 */
export async function athleteStats(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.user!.username;

    // sport is stored as its name, so we can group on it directly.
    const perSport = await Reservation.aggregate([
      { $match: { user: username, status: { $in: ['confirmed', 'completed', 'pending'] } } },
      { $group: { _id: '$sport', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const monthly = await Reservation.aggregate([
      { $match: { user: username } },
      {
        $group: {
          _id: { y: { $year: '$start' }, m: { $month: '$start' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    // Total equipment spend across all athletes (not cancelled).
    const spendAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalEquipmentSpend = spendAgg[0]?.total || 0;

    res.json({
      perSport: perSport.map((p) => ({ sport: p._id, count: p.count })),
      monthly: monthly.map((m) => ({
        label: `${m._id.m}/${m._id.y}`,
        count: m.count,
      })),
      totalEquipmentSpend,
    });
  } catch (err) {
    next(err);
  }
}
