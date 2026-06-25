import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Facility, Reservation, Training, Promotion, Equipment, Order } from '../models';
import { HttpError } from '../middleware/error';
import { inCheckInWindow, isOnTheHour, overlaps } from '../utils/dates';
import { userMap, display } from '../utils/users';
import { normalizeCity } from '../utils/cities';
import { geocodeAddress } from '../utils/geocode';

/** Facility ids managed by the current employee (employees store usernames). */
async function myFacilityIds(username: string): Promise<Types.ObjectId[]> {
  const facilities = await Facility.find({ employees: username }).select('_id').lean();
  return facilities.map((f) => f._id as Types.ObjectId);
}

async function assertOwnedFacility(username: string, facilityId: string) {
  const facility = await Facility.findOne({ _id: facilityId, employees: username });
  if (!facility) throw new HttpError(403, 'Nemate pristup ovom objektu.');
  return facility;
}

// ---------- Facilities ----------
export async function myFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await Facility.find({ employees: req.user!.username }).lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

function buildFacilityPayload(body: any, employeeId: string) {
  return {
    name: body.name,
    city: normalizeCity(body.city),
    address: body.address,
    maticniBroj: String(body.maticniBroj),
    pib: String(body.pib),
    employees: [employeeId],
    status: 'pending' as const,
    pricePerHour: Number(body.pricePerHour) || 0,
    workingHours: {
      open: body.workingHours?.open || '08:00',
      close: body.workingHours?.close || '22:00',
    },
    maxNoShows: Number(body.maxNoShows) || 3,
    sports: body.sports || [],
    location:
      body.location?.lat && body.location?.lng
        ? { lat: Number(body.location.lat), lng: Number(body.location.lng) }
        : undefined,
    description: body.description || '',
    images: body.images || [],
    resources: (body.resources || []).map((r: any) => ({
      name: r.name,
      type: r.type,
      capacity: Number(r.capacity),
      equipmentDescription: (r.equipmentDescription || '').slice(0, 300),
      sport: r.sport,
    })),
  };
}

export async function createFacility(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = buildFacilityPayload(req.body, req.user!.username);
    validateFacilityRules(payload);
    // Auto-locate from the entered address unless coordinates were provided.
    if (!payload.location) payload.location = (await geocodeAddress(payload.address, payload.city)) || undefined;
    const facility = await Facility.create(payload);
    res.status(201).json(facility);
  } catch (err) {
    next(err);
  }
}

/** Create a facility from an uploaded JSON file (same data as the form). */
export async function createFacilityFromJson(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new HttpError(422, 'JSON fajl je obavezan.');
    const fs = await import('fs');
    const raw = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new HttpError(422, 'Neispravan JSON.');
    }
    const payload = buildFacilityPayload(data, req.user!.username);
    validateFacilityRules(payload);
    if (!payload.location) payload.location = (await geocodeAddress(payload.address, payload.city)) || undefined;
    const facility = await Facility.create(payload);
    res.status(201).json(facility);
  } catch (err) {
    next(err);
  }
}

function validateFacilityRules(p: any) {
  if (!/^\d{8}$/.test(p.maticniBroj)) throw new HttpError(422, 'Matični broj mora imati 8 cifara.');
  if (!/^[1-9]\d{8}$/.test(p.pib)) throw new HttpError(422, 'PIB mora imati 9 cifara i ne sme počinjati nulom.');
  const names = p.resources.map((r: any) => r.name);
  if (new Set(names).size !== names.length) throw new HttpError(422, 'Nazivi terena/hala moraju biti jedinstveni.');
  const hasOpen = p.resources.some((r: any) => r.type === 'open' && Number(r.capacity) >= 4);
  if (p.resources.length && !hasOpen) {
    throw new HttpError(422, 'Obavezan je bar jedan otvoreni teren sa najmanje 4 mesta.');
  }
}

export async function updateFacility(req: Request, res: Response, next: NextFunction) {
  try {
    const owned = await assertOwnedFacility(req.user!.username, String(req.params.id));
    const { name, city, address, pricePerHour, workingHours, maxNoShows, description, sports } = req.body;
    const update: any = { name, city, address, description };
    if (pricePerHour !== undefined) update.pricePerHour = Number(pricePerHour);
    if (maxNoShows !== undefined) update.maxNoShows = Number(maxNoShows);
    if (workingHours) update.workingHours = workingHours;
    if (sports) update.sports = sports;
    if (update.city) update.city = normalizeCity(update.city);
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    // Re-geocode when the address or city changes (fall back to current values).
    if (update.address || update.city) {
      const located = await geocodeAddress(update.address ?? owned.address, update.city ?? owned.city);
      if (located) update.location = located;
    }
    const facility = await Facility.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(facility);
  } catch (err) {
    next(err);
  }
}

export async function addResource(req: Request, res: Response, next: NextFunction) {
  try {
    const facility = await assertOwnedFacility(req.user!.username, String(req.params.id));
    const { name, type, capacity, equipmentDescription, sport } = req.body;
    if (facility.resources.some((r) => r.name === name)) {
      throw new HttpError(409, 'Naziv terena/hale mora biti jedinstven u objektu.');
    }
    if (type === 'open' && Number(capacity) < 4) {
      throw new HttpError(422, 'Otvoreni teren mora imati najmanje 4 mesta.');
    }
    facility.resources.push({
      name,
      type,
      capacity: Number(capacity),
      equipmentDescription: (equipmentDescription || '').slice(0, 300),
      sport,
    } as any);
    await facility.save();
    res.status(201).json(facility);
  } catch (err) {
    next(err);
  }
}

/** Update an existing resource (teren/hala/dvorana) within an owned facility. */
export async function updateResource(req: Request, res: Response, next: NextFunction) {
  try {
    const facility = await assertOwnedFacility(req.user!.username, String(req.params.id));
    const resourceId = String(req.params.resourceId);
    const resource = facility.resources.id(resourceId);
    if (!resource) throw new HttpError(404, 'Teren/hala nije pronađen.');

    const { name, type, capacity, equipmentDescription, sport } = req.body;

    if (name !== undefined) {
      // Unique name among the OTHER resources of this facility.
      const clash = facility.resources.some(
        (r) => r.name === name && String(r._id) !== resourceId
      );
      if (clash) throw new HttpError(409, 'Naziv terena/hale mora biti jedinstven u objektu.');
      resource.name = name;
    }
    if (type !== undefined) resource.type = type;
    if (capacity !== undefined) resource.capacity = Number(capacity);
    if (sport !== undefined) resource.sport = sport;
    if (equipmentDescription !== undefined) {
      resource.equipmentDescription = String(equipmentDescription).slice(0, 300);
    }
    if (resource.type === 'open' && resource.capacity < 4) {
      throw new HttpError(422, 'Otvoreni teren mora imati najmanje 4 mesta.');
    }

    await facility.save();
    res.json(facility);
  } catch (err) {
    next(err);
  }
}

/** Upload one or more facility gallery images (multer disk storage). */
export async function addFacilityImages(req: Request, res: Response, next: NextFunction) {
  try {
    const facility = await assertOwnedFacility(req.user!.username, String(req.params.id));
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) throw new HttpError(422, 'Nijedna slika nije otpremljena.');
    for (const f of files) facility.images.push(f.filename);
    await facility.save();
    res.status(201).json(facility);
  } catch (err) {
    next(err);
  }
}

/** Remove a single facility image (and best-effort delete the file). */
export async function removeFacilityImage(req: Request, res: Response, next: NextFunction) {
  try {
    const facility = await assertOwnedFacility(req.user!.username, String(req.params.id));
    const filename = String(req.params.filename);
    facility.images = facility.images.filter((img) => img !== filename) as any;
    await facility.save();
    try {
      const fs = await import('fs');
      const path = await import('path');
      fs.unlinkSync(path.resolve(__dirname, '../../uploads', filename));
    } catch {
      /* file may not exist / be shared — ignore */
    }
    res.json(facility);
  } catch (err) {
    next(err);
  }
}

// ---------- Reservations & trainings ----------
export async function facilityReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    const reservations = await Reservation.find({ facility: { $in: ids } })
      .sort({ start: -1 })
      .populate('facility', 'name resources')
      .lean();
    const trainings = await Training.find({ facility: { $in: ids } })
      .sort({ start: -1 })
      .populate('trainer', 'name')
      .populate('facility', 'name')
      .lean();
    // Resolve usernames -> full-name display objects.
    const map = await userMap([...reservations.map((r) => r.user), ...trainings.map((t) => t.user)]);
    res.json({
      reservations: reservations.map((r) => ({ ...r, user: display(map, r.user) })),
      trainings: trainings.map((t) => ({ ...t, user: display(map, t.user) })),
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await getOwnedReservation(req.user!.username, String(req.params.id));
    if (!inCheckInWindow(reservation.start)) {
      throw new HttpError(400, 'Potvrda je moguća samo do 10 minuta po početku termina.');
    }
    reservation.status = 'confirmed';
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}

export async function noShowReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await getOwnedReservation(req.user!.username, String(req.params.id));
    if (!inCheckInWindow(reservation.start)) {
      throw new HttpError(400, 'Odjava je moguća samo do 10 minuta po početku termina.');
    }
    reservation.status = 'no_show';
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}

/** Drag-and-drop reschedule (closed halls / dvorane). */
export async function moveReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const reservation = await getOwnedReservation(req.user!.username, String(req.params.id));
    const facility = await Facility.findById(reservation.facility);
    const resource = facility?.resources.id(reservation.resourceId);
    if (!resource) throw new HttpError(404, 'Teren/hala nije pronađen.');
    if (resource.type === 'open') {
      throw new HttpError(400, 'Premeštanje je dozvoljeno samo za zatvorene hale/dvorane.');
    }
    const newStart = new Date(req.body.start);
    if (isNaN(newStart.getTime()) || !isOnTheHour(newStart)) {
      throw new HttpError(422, 'Termin mora počinjati na pun sat.');
    }
    const dur = reservation.end.getTime() - reservation.start.getTime();
    const newEnd = new Date(newStart.getTime() + dur);

    const others = await Reservation.find({
      _id: { $ne: reservation._id },
      facility: reservation.facility,
      resourceId: reservation.resourceId,
      status: { $ne: 'cancelled' },
    }).lean();
    if (others.some((o) => overlaps(newStart, newEnd, o.start, o.end))) {
      throw new HttpError(409, 'Termin je već zauzet.');
    }
    reservation.start = newStart;
    reservation.end = newEnd;
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    next(err);
  }
}

async function getOwnedReservation(userId: string, reservationId: string) {
  const ids = await myFacilityIds(userId);
  const reservation = await Reservation.findOne({ _id: reservationId, facility: { $in: ids } });
  if (!reservation) throw new HttpError(404, 'Rezervacija nije pronađena.');
  return reservation;
}

// ---------- Promotions ----------
export async function listPromotions(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    res.json(
      await Promotion.find({ facility: { $in: ids } })
        .populate('facility', 'name')
        .lean()
    );
  } catch (err) {
    next(err);
  }
}

export async function createPromotion(req: Request, res: Response, next: NextFunction) {
  try {
    await assertOwnedFacility(req.user!.username, req.body.facility);
    const promo = await Promotion.create(req.body);
    res.status(201).json(promo);
  } catch (err) {
    next(err);
  }
}

export async function updatePromotion(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    const promo = await Promotion.findOneAndUpdate(
      { _id: req.params.id, facility: { $in: ids } },
      req.body,
      { new: true }
    );
    if (!promo) throw new HttpError(404, 'Promocija nije pronađena.');
    res.json(promo);
  } catch (err) {
    next(err);
  }
}

export async function deletePromotion(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    const r = await Promotion.deleteOne({ _id: req.params.id, facility: { $in: ids } });
    if (!r.deletedCount) throw new HttpError(404, 'Promocija nije pronađena.');
    res.json({ message: 'Obrisano.' });
  } catch (err) {
    next(err);
  }
}

// ---------- Equipment & orders ----------
export async function listFacilityEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    res.json(
      await Equipment.find({ facility: { $in: ids } })
        .populate('facility', 'name')
        .lean()
    );
  } catch (err) {
    next(err);
  }
}

export async function createEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    await assertOwnedFacility(req.user!.username, req.body.facility);
    const eq = await Equipment.create({
      name: req.body.name,
      sport: req.body.sport,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      facility: req.body.facility,
      ...(req.file ? { image: `/uploads/${req.file.filename}` } : {}),
    });
    res.status(201).json(eq);
  } catch (err) {
    next(err);
  }
}

export async function updateEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    const update: any = {};
    if (req.body.price !== undefined) update.price = Number(req.body.price);
    if (req.body.stock !== undefined) update.stock = Number(req.body.stock);
    if (req.body.name) update.name = req.body.name;
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    const eq = await Equipment.findOneAndUpdate(
      { _id: req.params.id, facility: { $in: ids } },
      update,
      { new: true }
    );
    if (!eq) throw new HttpError(404, 'Oprema nije pronađena.');
    res.json(eq);
  } catch (err) {
    next(err);
  }
}

export async function facilityOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await myFacilityIds(req.user!.username);
    const equipment = await Equipment.find({ facility: { $in: ids } }).select('_id').lean();
    const eqIds = equipment.map((e) => e._id);
    const orders = await Order.find({ 'items.equipment': { $in: eqIds } })
      .sort({ createdAt: -1 })
      .populate('items.equipment', 'name')
      .lean();
    const map = await userMap(orders.map((o) => o.user));
    res.json(orders.map((o) => ({ ...o, user: display(map, o.user) })));
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body; // accepted | picked_up | cancelled | ordered
    if (!['ordered', 'accepted', 'picked_up', 'cancelled'].includes(status)) {
      throw new HttpError(422, 'Neispravan status.');
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) throw new HttpError(404, 'Porudžbina nije pronađena.');
    res.json(order);
  } catch (err) {
    next(err);
  }
}
