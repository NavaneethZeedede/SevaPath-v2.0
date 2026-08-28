"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Water Supply", "Electricity", "Roads", "Sanitation", "Property/Tax", "Other"];

export function FileGrievanceForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng] = useState("");
  const [locationText, setLocationText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function geocode() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (res.ok) {
        setLocationText(data.display_name);
        setLat(String(data.lat));
      } else {
        setMsg("Could not geocode that address.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        description,
        location_text: locationText || address || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to file");
      return;
    }
    router.push(`/citizen/${data.caseId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-6">
      <div>
        <label className="text-sm font-medium text-slate-700">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Water tanker hasn't arrived in 3 weeks"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the problem clearly…"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Location</label>
        <div className="mt-1 flex gap-2">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Type an address to auto-tag"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button type="button" onClick={geocode} disabled={busy || !address} className="btn-secondary">
            Auto-tag
          </button>
        </div>
        {locationText && (
          <p className="mt-2 text-xs text-verified">📍 Tagged: {locationText}</p>
        )}
      </div>
      {msg && <p className="text-sm text-breach">{msg}</p>}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Filing creates event #1 in the case chain and sends you a confirmation email.
        </p>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Filing…" : "File grievance"}
        </button>
      </div>
    </form>
  );
}
