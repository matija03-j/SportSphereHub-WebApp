import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Mirrors the server rule: 8–12 chars, starts with a letter, has uppercase, digit, special. */
export const PASSWORD_REGEX = /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

export function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  return PASSWORD_REGEX.test(v) ? null : { password: true };
}

/** Exactly 8 digits. */
export function maticniBrojValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  return /^\d{8}$/.test(v) ? null : { maticni: true };
}

/** Phone: digits with optional leading + and spaces (no letters). */
export const PHONE_REGEX = /^\+?[\d\s]{6,20}$/;

export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  return PHONE_REGEX.test(v) ? null : { phone: true };
}

/** Exactly 9 digits, not starting with zero. */
export function pibValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  return /^[1-9]\d{8}$/.test(v) ? null : { pib: true };
}
