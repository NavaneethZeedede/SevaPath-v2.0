import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
