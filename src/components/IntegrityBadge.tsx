export function IntegrityBadge({ status }: { status: "VERIFIED" | "INTEGRITY_BREACH" }) {
  if (status === "VERIFIED") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 px-5 py-4 ring-1 ring-green-200">
        <span className="text-3xl">✅</span>
        <div>
          <div className="text-lg font-bold text-verified">VERIFIED</div>
          <div className="text-sm text-green-700">
            Every event in this case&rsquo;s chain checks out. The history is intact.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
      <span className="text-3xl">🚨</span>
      <div>
        <div className="text-lg font-bold text-breach">INTEGRITY BREACH</div>
        <div className="text-sm text-red-700">
          At least one event failed verification. See the highlighted event below for the exact
          check that failed.
        </div>
      </div>
    </div>
  );
}

export function PendingBadge() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200">
      <span className="text-3xl">⏳</span>
      <div>
        <div className="text-lg font-bold text-pending">AWAITING VERIFICATION</div>
        <div className="text-sm text-amber-700">Chain not yet evaluated for this view.</div>
      </div>
    </div>
  );
}
