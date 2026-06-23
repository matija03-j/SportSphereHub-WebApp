import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { uploadImage } from '../middleware/upload';
import { PASSWORD_REGEX } from '../utils/password';
import {
  register,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

export const authRouter = Router();

const passwordRule = body('password')
  .matches(PASSWORD_REGEX)
  .withMessage(
    'Lozinka mora imati 8–12 karaktera, počinjati slovom i sadržati veliko slovo, broj i specijalni karakter.'
  );

authRouter.post(
  '/register',
  uploadImage.single('profileImage'),
  validate([
    body('username').isString().trim().isLength({ min: 3 }).withMessage('Korisničko ime je obavezno (min 3).'),
    passwordRule,
    body('firstName').notEmpty().withMessage('Ime je obavezno.'),
    body('lastName').notEmpty().withMessage('Prezime je obavezno.'),
    body('phone').notEmpty().withMessage('Telefon je obavezan.'),
    body('email').isEmail().withMessage('Neispravan e-mejl.'),
    body('role').isIn(['athlete', 'employee']).withMessage('Nepoznata uloga.'),
    // Employee-only fields, validated conditionally.
    body('maticniBroj')
      .if(body('role').equals('employee'))
      .matches(/^\d{8}$/)
      .withMessage('Matični broj mora imati tačno 8 cifara.'),
    body('pib')
      .if(body('role').equals('employee'))
      .matches(/^[1-9]\d{8}$/)
      .withMessage('PIB mora imati tačno 9 cifara i ne sme počinjati nulom.'),
    body('facilityName')
      .if(body('role').equals('employee'))
      .notEmpty()
      .withMessage('Naziv objekta je obavezan.'),
    body('address')
      .if(body('role').equals('employee'))
      .notEmpty()
      .withMessage('Adresa sedišta je obavezna.'),
  ]),
  register
);

authRouter.post(
  '/login',
  validate([body('username').notEmpty(), body('password').notEmpty()]),
  login
);

authRouter.post(
  '/admin-login',
  validate([body('username').notEmpty(), body('password').notEmpty()]),
  adminLogin
);

authRouter.post(
  '/forgot-password',
  validate([body('identifier').notEmpty().withMessage('Unesite korisničko ime ili e-mejl.')]),
  forgotPassword
);

authRouter.post(
  '/reset-password',
  validate([body('token').notEmpty(), passwordRule]),
  resetPassword
);
