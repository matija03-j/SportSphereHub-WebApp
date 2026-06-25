import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { User, Facility, PasswordResetToken } from '../models';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken, randomToken } from '../utils/token';
import { sendResetEmail } from '../utils/mailer';
import { HttpError } from '../middleware/error';
import { normalizeCity } from '../utils/cities';
import { geocodeAddress } from '../utils/geocode';
import { env } from '../config/env';

/** Shapes a user document for client responses (no password hash). */
export async function publicUser(id: Types.ObjectId | string) {
  const u = await User.findById(id).lean();
  if (!u) return null;
  const { passwordHash, ...rest } = u as any;
  return rest;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, firstName, lastName, phone, email, role } = req.body;
    let sports: string[] = [];
    if (req.body.sports) {
      sports = Array.isArray(req.body.sports) ? req.body.sports : JSON.parse(req.body.sports);
    }
    if (sports.length > 5) throw new HttpError(422, 'Možete izabrati najviše 5 sportova.');
    if (role !== 'athlete' && role !== 'employee') {
      throw new HttpError(422, 'Nepoznata uloga.');
    }

    // Multer is configured with .fields() so files arrive grouped by field name.
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    const profileFile = files?.['profileImage']?.[0];
    const profileImage = profileFile ? `/uploads/${profileFile.filename}` : undefined;
    const facilityImages = (files?.['images'] || []).map((f) => f.filename);
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username,
      passwordHash,
      firstName,
      lastName,
      phone,
      email,
      sports,
      role,
      status: 'pending',
      ...(profileImage ? { profileImage } : {}),
    });

    // Employee additionally registers / joins a sports facility (pending approval).
    if (role === 'employee') {
      const { facilityName, address, maticniBroj, pib } = req.body;
      let facility = await Facility.findOne({ $or: [{ maticniBroj }, { pib }] });
      if (facility) {
        if (facility.employees.length >= 2) {
          await User.deleteOne({ _id: user._id });
          throw new HttpError(409, 'Objekat već ima maksimalan broj zaposlenih (2).');
        }
        facility.employees.push(user.username);
        await facility.save();
      } else {
        const city = normalizeCity(req.body.city || '');
        const location = (await geocodeAddress(address, city)) || undefined;
        await Facility.create({
          name: facilityName,
          city,
          address,
          maticniBroj,
          pib,
          employees: [user.username],
          status: 'pending',
          pricePerHour: Number(req.body.pricePerHour) || 1500,
          location,
          images: facilityImages,
        });
      }
    }

    res.status(201).json({
      message: 'Zahtev za registraciju je kreiran i čeka odobrenje administratora.',
      user: await publicUser(user._id as Types.ObjectId),
    });
  } catch (err) {
    next(err);
  }
}

async function doLogin(req: Request, res: Response, expectedRole: 'admin' | 'user') {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Pogrešno korisničko ime ili lozinka.');
  }
  if (expectedRole === 'admin' && user.role !== 'admin') {
    throw new HttpError(403, 'Pogrešno korisničko ime ili lozinka.');
  }
  if (expectedRole === 'user' && user.role === 'admin') {
    throw new HttpError(403, 'Administrator se prijavljuje preko posebne forme.');
  }
  if (user.status === 'pending') {
    throw new HttpError(403, 'Vaš nalog još uvek čeka odobrenje administratora.');
  }
  if (user.status === 'rejected') {
    throw new HttpError(403, 'Vaš zahtev za registraciju je odbijen.');
  }
  const token = signToken({
    id: String(user._id),
    role: user.role,
    username: user.username,
  });
  res.json({ token, user: await publicUser(user._id as Types.ObjectId) });
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    await doLogin(req, res, 'user');
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    await doLogin(req, res, 'admin');
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier } = req.body; // username or email
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: String(identifier).toLowerCase() }],
    });
    // Always respond the same way (do not leak which accounts exist).
    if (user) {
      const token = randomToken();
      await PasswordResetToken.create({
        user: user.username,
        token,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      await sendResetEmail(user.email, `${env.resetUrlBase}?token=${token}`);
    }
    res.json({ message: 'Ako nalog postoji, poslat je link za resetovanje lozinke.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    const record = await PasswordResetToken.findOne({ token });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new HttpError(400, 'Link za resetovanje je nevažeći ili je istekao.');
    }
    const passwordHash = await hashPassword(password);
    await User.updateOne({ username: record.user }, { passwordHash });
    await PasswordResetToken.deleteOne({ _id: record._id });
    res.json({ message: 'Lozinka je uspešno promenjena.' });
  } catch (err) {
    next(err);
  }
}
