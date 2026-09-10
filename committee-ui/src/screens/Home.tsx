import { Link } from "react-router-dom";
import {
  ClipboardList,
  HandHeart,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "../components/ui/button";

const tiles = [
  {
    to: "/community/households",
    title: "Households",
    blurb: "Census and family contacts",
    icon: Users,
  },
  {
    to: "/funds/payments",
    title: "Collections",
    blurb: "Chanda, Zakat, receipts",
    icon: Wallet,
  },
  {
    to: "/services/tickets",
    title: "Service tickets",
    blurb: "Nikah, NOC, certificates",
    icon: Ticket,
  },
  {
    to: "/welfare/grants",
    title: "Welfare grants",
    blurb: "Zakat applications",
    icon: HandHeart,
  },
  {
    to: "/welfare/compliance",
    title: "Compliance",
    blurb: "Checklists and filings",
    icon: ClipboardList,
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <p className="text-sm font-medium text-brand-600">Committee console</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Assalamu alaikum — here’s your jamath workspace
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Simple mode keeps the day-to-day work clear. Switch to Advanced anytime for full
          ERPNext Desk (accounts, stock, and deeper reports).
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-600/30 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-brand-100 p-2.5 text-brand-700">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-semibold text-zinc-900">{t.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{t.blurb}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5">
        <p className="text-sm font-medium text-zinc-800">Need the full ERPNext Desk?</p>
        <p className="mt-1 text-sm text-zinc-500">
          Advanced mode unlocks Chart of Accounts and every Desk workspace without leaving this
          product.
        </p>
        <div className="mt-3">
          <Link to="/settings">
            <Button variant="outline">Open settings</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
