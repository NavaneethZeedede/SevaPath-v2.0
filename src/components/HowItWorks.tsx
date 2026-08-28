export function HowItWorks() {
  const anchoringMethod = process.env.GITHUB_TOKEN
    ? "GitHub Gist (real, immutable, public)"
    : "Local append-only public ledger (demo fallback — set GITHUB_TOKEN for a real GitHub Gist anchor, or wire OpenTimestamps for a Bitcoin timestamp)";
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-800">How this works</h2>
      <p className="mt-1 text-sm text-slate-600">
        Plain-language summary of the integrity guarantees. (This panel is shown in the app, not
        just in the pitch.)
      </p>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        <li>
          <strong className="text-slate-800">Every action is an event.</strong> Filing, assigning,
          escalating, responding, and closing each append a sealed event to the case&rsquo;s chain.
          Past events are never edited.
        </li>
        <li>
          <strong className="text-slate-800">Events are linked.</strong> Each event stores a hash of
          the previous one, so deleting, reordering, or swapping an event breaks the chain.
        </li>
        <li>
          <strong className="text-slate-800">Officer signing is simulated.</strong> Each actor has a
          server-side HMAC secret key (not real PKI / hardware-backed signatures). The signature
          proves the action was made under that actor&rsquo;s identity within this simulation&rsquo;s
          assumptions.
        </li>
        <li>
          <strong className="text-slate-800">External anchoring.</strong> Currently:{" "}
          <span className="text-slate-800">{anchoringMethod}</span>. This stands in for what would be
          a permissioned inter-department ledger in a real government deployment.
        </li>
        <li>
          <strong className="text-slate-800">Verification is independent.</strong> Recomputing the
          hashes and signatures from stored data shows exactly which check failed, not just a generic
          &ldquo;tampered&rdquo; label.
        </li>
      </ul>
    </div>
  );
}
