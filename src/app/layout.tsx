import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SevaPath — Grievance Integrity Tracker",
  description:
    "A tamper-evident grievance tracking system. Every case action is recorded as a verifiable, cryptographically-linked event.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
