import * as store from "@/lib/store";
import { RawEditForm } from "@/components/RawEditForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRawEditPage() {
  const cases = await store.listCases();
  const casesWithEvents = await Promise.all(
    cases.map(async (c) => ({
      case_id: c.case_id,
      title: c.title,
      events: (await store.getEventsByCase(c.case_id)).map((e) => ({
        event_id: e.event_id,
        sequence_number: e.sequence_number,
        action: e.action,
        payload: e.payload,
      })),
    }))
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-800">Demo: raw database edit</h1>
      <p className="mt-1 text-sm text-slate-500">
        Simulate an attacker with direct DB access. Hidden route — not in any navigation.
      </p>
      <div className="mt-6">
        <RawEditForm cases={casesWithEvents} />
      </div>
    </main>
  );
}
