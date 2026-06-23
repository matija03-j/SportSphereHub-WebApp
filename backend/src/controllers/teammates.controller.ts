import { Request, Response, NextFunction } from 'express';
import { TeammateAd } from '../models';
import { HttpError } from '../middleware/error';
import { userMap, display } from '../utils/users';

/** Resolve author/join-request usernames to {username,firstName,lastName} for display. */
async function shapeAds(ads: any[]) {
  const usernames = ads.flatMap((a) => [a.author, ...a.joinRequests.map((r: any) => r.user)]);
  const map = await userMap(usernames);
  return ads.map((a) => ({
    ...a,
    author: display(map, a.author),
    joinRequests: a.joinRequests.map((r: any) => ({ ...r, user: display(map, r.user) })),
  }));
}

export async function listAds(_req: Request, res: Response, next: NextFunction) {
  try {
    const ads = await TeammateAd.find({ status: 'active' }).sort({ createdAt: -1 }).lean();
    res.json(await shapeAds(ads));
  } catch (err) {
    next(err);
  }
}

export async function myAds(req: Request, res: Response, next: NextFunction) {
  try {
    const ads = await TeammateAd.find({ author: req.user!.username }).sort({ createdAt: -1 }).lean();
    res.json(await shapeAds(ads));
  } catch (err) {
    next(err);
  }
}

export async function createAd(req: Request, res: Response, next: NextFunction) {
  try {
    const { sport, city, date, timeFrom, timeTo, neededPlayers } = req.body;
    const ad = await TeammateAd.create({
      author: req.user!.username,
      sport,
      city,
      date,
      timeFrom,
      timeTo,
      neededPlayers: Number(neededPlayers),
      status: 'active',
      joinRequests: [],
    });
    res.status(201).json(ad);
  } catch (err) {
    next(err);
  }
}

export async function joinAd(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.user!.username;
    const ad = await TeammateAd.findById(req.params.id);
    if (!ad || ad.status !== 'active') throw new HttpError(404, 'Oglas nije aktivan.');
    if (ad.author === username) throw new HttpError(400, 'Ne možete se prijaviti na svoj oglas.');
    if (ad.joinRequests.some((r) => r.user === username)) {
      throw new HttpError(409, 'Već ste poslali zahtev.');
    }
    ad.joinRequests.push({ user: username, status: 'pending' } as any);
    await ad.save();
    res.json({ message: 'Zahtev za pridruživanje je poslat.' });
  } catch (err) {
    next(err);
  }
}

/** Author approves/rejects a join request. */
export async function decideRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { decision } = req.body; // 'approved' | 'rejected'
    const ad = await TeammateAd.findOne({ _id: req.params.id, author: req.user!.username });
    if (!ad) throw new HttpError(404, 'Oglas nije pronađen.');
    const reqDoc = ad.joinRequests.id(String(req.params.reqId));
    if (!reqDoc) throw new HttpError(404, 'Zahtev nije pronađen.');
    reqDoc.status = decision === 'approved' ? 'approved' : 'rejected';

    // When the team is complete, the ad becomes inactive.
    const approved = ad.joinRequests.filter((r) => r.status === 'approved').length;
    if (approved >= ad.neededPlayers) ad.status = 'inactive';
    await ad.save();
    res.json(ad);
  } catch (err) {
    next(err);
  }
}

export async function closeAd(req: Request, res: Response, next: NextFunction) {
  try {
    const ad = await TeammateAd.findOneAndUpdate(
      { _id: req.params.id, author: req.user!.username },
      { status: 'inactive' },
      { new: true }
    );
    if (!ad) throw new HttpError(404, 'Oglas nije pronađen.');
    res.json(ad);
  } catch (err) {
    next(err);
  }
}
