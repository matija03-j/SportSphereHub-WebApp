/**
 * Geocodes a street address to coordinates using OpenStreetMap Nominatim
 * (same map provider used on the client). No API key required. Best-effort:
 * returns null on failure so facility creation is never blocked.
 *
 * Nominatim usage policy: identify with a User-Agent and keep volume low.
 */
export async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [address, city, 'Srbija'].filter(Boolean).join(', ');
  if (!query.trim()) return null;

  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
    encodeURIComponent(query);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SportSphereHub/1.0 (PIA student project)',
        'Accept-Language': 'sr',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
