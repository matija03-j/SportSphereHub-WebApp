/**
 * Canonicalizes a city name to a single consistent (Serbian) spelling so the
 * same city never appears twice in lists (e.g. "Belgrade" vs "Beograd").
 * Intentionally a small known-alias map, not full geocoding.
 */
const ALIASES: Record<string, string> = {
  belgrade: 'Beograd',
  beograd: 'Beograd',
  nis: 'Niš',
  niš: 'Niš',
  'novi sad': 'Novi Sad',
  'novisad': 'Novi Sad',
  kragujevac: 'Kragujevac',
};

export function normalizeCity(raw: string): string {
  if (!raw) return raw;
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  const key = collapsed.toLowerCase();
  if (ALIASES[key]) return ALIASES[key];
  // Default: Title Case each word so casing variants merge too.
  return collapsed.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
