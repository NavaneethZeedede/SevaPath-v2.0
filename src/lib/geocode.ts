/**
 * Reverse geocoding via OpenStreetMap Nominatim (free, no API key).
 * Policy: one request at a time, descriptive User-Agent, no hammering.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "SevaPath-Integrity-Tracker/1.0 (hackathon demo)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<{
  display_name: string;
  lat: number;
  lng: number;
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "SevaPath-Integrity-Tracker/1.0 (hackathon demo)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    if (!data.length) return null;
    return {
      display_name: data[0].display_name,
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
    };
  } catch {
    return null;
  }
}
