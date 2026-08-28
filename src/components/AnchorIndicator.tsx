import { Anchor } from "@/lib/types";

function methodLabel(method: string): string {
  if (method === "github-gist") return "GitHub Gist (external, immutable)";
  if (method === "opentimestamps") return "OpenTimestamps (Bitcoin)";
  return "Local public ledger (demo)";
}

export function AnchorIndicator({ anchors }: { anchors: Anchor[] }) {
  if (!anchors || anchors.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-pending ring-1 ring-amber-200">
        <span>⏳</span>
        <span>
          <strong className="font-semibold">Not yet anchored.</strong> A fingerprint of recent events
          will be published externally after the next few actions.
        </span>
      </div>
    );
  }
  const latest = anchors[0];
  return (
    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-verified ring-1 ring-green-200">
      <div className="flex items-center gap-2">
        <span>🔗</span>
        <span>
          <strong className="font-semibold">Anchored</strong> · last anchor{" "}
          {new Date(latest.anchored_at).toLocaleString()}
        </span>
        <a
          href={latest.external_reference}
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-md bg-brand-700 px-3 py-1 text-xs font-medium text-white hover:bg-brand-800"
        >
          Verify externally →
        </a>
      </div>
      <div className="mt-2 text-xs text-slate-600">
        Method: {methodLabel(latest.method)} · {anchors.length} anchor
        {anchors.length > 1 ? "s" : ""} · root hash{" "}
        <span className="hash">{latest.root_hash.slice(0, 24)}…</span>
      </div>
    </div>
  );
}
