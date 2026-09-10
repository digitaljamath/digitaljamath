import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { deskPath, getList, type ListRow } from "../lib/api";

export type Column = {
  key: string;
  label: string;
  render?: (row: ListRow) => ReactNode;
};

export function DocList({
  title,
  doctype,
  fields,
  columns,
  emptyHint,
}: {
  title: string;
  doctype: string;
  fields: string[];
  columns: Column[];
  emptyHint?: string;
}) {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getList(doctype, fields.includes("name") ? fields : ["name", ...fields]);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when doctype changes
  }, [doctype]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h2>
          <p className="text-sm text-zinc-500">{doctype}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <a href={deskPath(doctype)} target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-1.5">
              <ExternalLink className="size-3.5" />
              Desk
            </Button>
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading && !rows.length ? (
          <p className="p-6 text-sm text-zinc-500">Loading…</p>
        ) : !rows.length ? (
          <p className="p-6 text-sm text-zinc-500">
            {emptyHint || "No records yet. Create one in Desk, or we’ll add an in-console form next."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-semibold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-zinc-100 last:border-0 hover:bg-brand-50/40"
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-zinc-800">
                        {c.render
                          ? c.render(row)
                          : String(row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
