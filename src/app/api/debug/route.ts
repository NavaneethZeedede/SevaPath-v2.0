import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabaseOk = isSupabaseConfigured();
  try {
    const actor = await store.getActor("CIT_1");
    const allActors = await store.listActors();
    return NextResponse.json({
      supabaseConfigured: supabaseOk,
      cit1Found: !!actor,
      actorCount: allActors.length,
      actorEmails: allActors.map((a) => a.email),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
