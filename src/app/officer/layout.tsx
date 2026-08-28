import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/session";
import { TopBar } from "@/components/TopBar";

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login?role=OFFICER");
  if (actor.role !== "OFFICER") redirect(actor.role === "CITIZEN" ? "/citizen" : "/supervisor");
  return (
    <div>
      <TopBar actor={actor} homeHref="/officer" homeLabel="Officer queue" />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
