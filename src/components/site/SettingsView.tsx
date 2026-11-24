"use client";
import { useState } from "react";
import { QUALITIES, useQuality } from "@/lib/prefs";
import { writeLocalCompleted } from "@/lib/progress";
import { useCompleted } from "@/lib/useCompleted";

export function SettingsView() {
  const [quality, setQuality] = useQuality();
  const { ready, keys } = useCompleted();
  const [cleared, setCleared] = useState(false);

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-[14px] border border-line bg-surface p-5">
        <h2 className="text-[15px] font-extrabold">Graphics quality</h2>
        <p className="mt-1 text-[13px] text-ink-2">Stored on this device. Lower it if the 3D view feels slow or warms your phone.</p>
        <div role="radiogroup" aria-label="Graphics quality" className="mt-3 grid gap-2">
          {QUALITIES.map((q) => (
            <button
              key={q.id}
              type="button"
              role="radio"
              aria-checked={quality === q.id}
              onClick={() => setQuality(q.id)}
              className={`flex items-center justify-between rounded-[10px] border px-3.5 py-2.5 text-left ${
                quality === q.id ? "border-ink bg-surface-raised" : "border-line hover:border-line-strong"
              }`}
            >
              <span className="text-[13.5px] font-bold">{q.label}</span>
              <span className="text-[12px] text-ink-3">{q.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-line bg-surface p-5">
        <h2 className="text-[15px] font-extrabold">Progress on this device</h2>
        <p className="mt-1 text-[13px] text-ink-2">
          {ready ? `${keys.length} lesson${keys.length === 1 ? "" : "s"} completed here.` : "Checking…"} Progress is kept in this browser until you sign in.
        </p>
        <button
          type="button"
          disabled={!ready || keys.length === 0 || cleared}
          onClick={() => {
            if (window.confirm("Clear completed lessons from this browser? This cannot be undone.")) {
              writeLocalCompleted([]);
              try {
                localStorage.removeItem("forma.completed.v1");
              } catch {
                /* ignore */
              }
              setCleared(true);
            }
          }}
          className="mt-3 rounded-[9px] border border-line-strong px-4 py-2 text-[13px] font-bold text-ink hover:bg-ground-deep disabled:opacity-40"
        >
          {cleared ? "Cleared" : "Clear progress on this device"}
        </button>
      </section>
    </div>
  );
}
