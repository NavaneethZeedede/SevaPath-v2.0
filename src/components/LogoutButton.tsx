"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn-secondary px-3 py-1.5 text-xs">
      Sign out
    </button>
  );
}
