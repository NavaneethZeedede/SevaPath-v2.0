import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const emails = await store.listEmails();
  return NextResponse.json({ emails });
}
