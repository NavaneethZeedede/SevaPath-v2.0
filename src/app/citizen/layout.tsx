import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/session";
import { TopBar } from "@/components/TopBar";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login?role=CITIZEN");
  if (actor.role !== "CITIZEN") redirect(actor.role === "OFFICER" ? "/officer" : "/supervisor");
  return (
    <div>
      <TopBar actor={actor} homeHref="/citizen" homeLabel="My grievances" />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
