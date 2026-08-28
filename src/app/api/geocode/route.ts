import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode, geocodeAddress } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const address = req.nextUrl.searchParams.get("address");

  if (address) {
    const r = await geocodeAddress(address);
    if (!r) return NextResponse.json({ error: "No match" }, { status: 404 });
    return NextResponse.json(r);
  }
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    const name = await reverseGeocode(lat, lng);
    if (!name) return NextResponse.json({ error: "No match" }, { status: 404 });
    return NextResponse.json({ display_name: name, lat, lng });
  }
  return NextResponse.json({ error: "Provide lat/lng or address" }, { status: 400 });
}
