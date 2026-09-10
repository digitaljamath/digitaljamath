import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

/** Placeholder list screens — wired to Frappe list APIs next. */
export default function Placeholder({
  title,
  doctype,
}: {
  title: string;
  doctype?: string;
}) {
  const desk = import.meta.env.PROD
    ? `/app/${(doctype || "").toLowerCase().replace(/ /g, "-")}`
    : `http://127.0.0.1:8000/app/${(doctype || "").toLowerCase().replace(/ /g, "-")}`;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">
        This screen will list and edit records in the committee console. For now you can open the
        Desk list, or return home.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {doctype ? (
          <a href={desk} target="_blank" rel="noreferrer">
            <Button variant="outline">Open in Desk</Button>
          </a>
        ) : null}
        <Link to="/">
          <Button>Back to overview</Button>
        </Link>
      </div>
    </div>
  );
}
