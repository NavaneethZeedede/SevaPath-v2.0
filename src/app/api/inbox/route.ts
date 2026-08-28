import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ emails: store.listEmails() });
}
