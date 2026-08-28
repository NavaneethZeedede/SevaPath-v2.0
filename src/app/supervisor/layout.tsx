import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/session";
import { TopBar } from "@/components/TopBar";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login?role=SUPERVISOR");
  if (actor.role !== "SUPERVISOR") redirect(actor.role === "CITIZEN" ? "/citizen" : "/officer");
  return (
    <div>
      <TopBar actor={actor} homeHref="/supervisor" homeLabel="Supervisor" />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
