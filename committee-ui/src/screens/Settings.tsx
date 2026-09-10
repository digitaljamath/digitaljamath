import { Button } from "../components/ui/button";
import { getMode, setMode } from "../lib/mode";
import { useState } from "react";

const DESK = import.meta.env.PROD ? "/app" : "http://127.0.0.1:8000/app";

export default function Settings() {
  const [mode, setModeState] = useState(getMode());

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Choose how much of ERPNext your committee sees day to day.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-800">Navigation mode</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                id: "simple" as const,
                title: "Simple",
                blurb: "Jamath workflows only — households, funds, tickets, welfare.",
              },
              {
                id: "advanced" as const,
                title: "Advanced",
                blurb: "Same console plus Chart of Accounts and one-click ERPNext Desk.",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setMode(opt.id);
                setModeState(opt.id);
              }}
              className={`rounded-xl border p-4 text-left transition ${
                mode === opt.id
                  ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <p className="font-semibold text-zinc-900">{opt.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{opt.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-800">ERPNext Desk</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Full Frappe Desk for power users — accounting dimensions, custom reports, and every
          DocType.
        </p>
        <a href={DESK} target="_blank" rel="noreferrer" className="mt-3 inline-block">
          <Button variant="outline">Open Advanced Desk</Button>
        </a>
      </section>
    </div>
  );
}
