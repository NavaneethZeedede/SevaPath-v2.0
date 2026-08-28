import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-lg font-bold text-white">
            S
          </div>
          <div>
            <div className="text-lg font-semibold text-brand-800">SevaPath</div>
            <div className="text-xs text-slate-500">Grievance Integrity Tracker</div>
          </div>
        </div>
        <Link href="/login" className="btn-secondary">
          Sign in
        </Link>
      </header>

      <section className="mt-14">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Public-service hackathon prototype
        </span>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-900">
          A grievance portal citizens can actually trust.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Complaints are too often marked &ldquo;Resolved&rdquo; with a one-line reply while the
          real problem stays unsolved. SevaPath replaces the single status word with a full,
          verifiable timeline — every action sealed, linked, and anchored so tampering is
          detectable, not just promised.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?role=CITIZEN" className="btn-primary">
            Enter as Citizen
          </Link>
          <Link href="/login?role=OFFICER" className="btn-secondary">
            Enter as Officer
          </Link>
          <Link href="/login?role=SUPERVISOR" className="btn-secondary">
            Enter as Supervisor
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        <Feature
          title="Verifiable timeline"
          body="Each case action is an immutable, appended event cryptographically linked to the one before it."
        />
        <Feature
          title="Tamper-evident"
          body="If a past record is altered — even via direct database access — the next check flags exactly which event and which check failed."
        />
        <Feature
          title="Externally anchored"
          body="A fingerprint of recent events is published to an external, independently-checkable record, not just our own database."
        />
      </section>

      <section className="mt-16">
        <HowItWorks />
      </section>

      <section className="mt-12 text-sm text-slate-500">
        Demo accounts (use the email to sign in): citizens priya.sharma@example.com,
        arjun.mehta@example.com; officers ravik@water.gov.in, deepakn@elec.gov.in; supervisor
        sup@gov.in. There is also a hidden{" "}
        <Link href="/admin/raw-edit" className="text-brand-700 underline">
          demo tamper panel
        </Link>{" "}
        used only to simulate an attacker with database access.
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-5">
      <div className="font-semibold text-slate-800">{title}</div>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
