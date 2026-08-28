import * as store from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const emails = await store.listEmails();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Demo email inbox</h1>
      <p className="mt-1 text-sm text-slate-500">
        Emails sent by the notification integration land here. (With RESEND_API_KEY set they are also
        sent for real via Resend.)
      </p>

      {emails.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-slate-500">No emails yet.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {emails.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">{m.subject}</div>
                <div className="text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-500">To: {m.to_email}{m.case_id ? ` · ${m.case_id}` : ""}</div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{m.body}</pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
