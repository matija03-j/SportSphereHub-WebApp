import bcrypt from 'bcryptjs';

/**
 * Spec rule: 8–12 chars, at least one uppercase, one digit, one special char,
 * and MUST start with a letter.
 */
export const PASSWORD_REGEX =
  /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

export function isValidPassword(pw: string): boolean {
  return PASSWORD_REGEX.test(pw);
}

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export function comparePassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
