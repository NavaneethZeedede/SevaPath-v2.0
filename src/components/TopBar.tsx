import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { Actor } from "@/lib/types";

export function TopBar({
  actor,
  homeHref,
  homeLabel,
}: {
  actor: Actor;
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700 text-sm font-bold text-white">
              S
            </div>
            <span className="font-semibold text-brand-800">SevaPath</span>
          </Link>
          <Link href={homeHref} className="text-sm font-medium text-slate-600 hover:text-brand-700">
            {homeLabel}
          </Link>
          <Link href="/inbox" className="text-sm text-slate-600 hover:text-brand-700">
            Email inbox
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-800">{actor.name}</div>
            <div className="text-xs text-slate-500">
              {actor.role}
              {actor.department ? ` · ${actor.department}` : ""}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
