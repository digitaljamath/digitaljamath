import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  LayoutGrid,
  LogOut,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { APPS, appForPath, visibleItems } from "./lib/apps";
import { useAuth } from "./lib/auth";
import { applyTheme, getMode, getTheme, setMode, setTheme, type Mode } from "./lib/mode";
import { cn } from "./lib/utils";

const DESK = import.meta.env.PROD ? "/app" : "http://127.0.0.1:8000/app";

export default function AppShell() {
  const { fullName, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setModeState] = useState<Mode>(getMode);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    applyTheme();
    setDark(document.documentElement.classList.contains("dark"));
    const onMode = () => setModeState(getMode());
    window.addEventListener("dj:mode-change", onMode);
    return () => window.removeEventListener("dj:mode-change", onMode);
  }, []);

  const current = useMemo(() => appForPath(location.pathname), [location.pathname]);
  const items = useMemo(() => visibleItems(current, mode === "advanced"), [current, mode]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const g = item.group || "";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
          <img
            src="/assets/digital_jamath/images/logo-mark.png"
            alt=""
            className="size-7 object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">digitaljamath</p>
            <p className="truncate text-[11px] text-zinc-500">
              {mode === "simple" ? "Simple" : "Advanced"}
            </p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-2 py-2">
          {APPS.filter((a) => a.id !== "settings").map((app) => {
            const Icon = app.icon;
            const active = current.id === app.id;
            const first = app.items.find((i) => i.to)?.to || "/";
            return (
              <button
                key={app.id}
                type="button"
                title={app.name}
                onClick={() => navigate(first)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium",
                  active
                    ? "bg-brand-100 text-brand-700"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                <span className="truncate">{app.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {current.name}
          </p>
          {groups.map(([group, groupItems]) => (
            <div key={group || "main"} className="mb-3">
              {group ? (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {group}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  if (item.href) {
                    return (
                      <li key={item.href + item.label}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                        >
                          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{item.label}</span>
                          <ExternalLink className="ml-auto size-3 opacity-50" />
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to!}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                            isActive
                              ? "bg-brand-600 text-white"
                              : "text-zinc-600 hover:bg-zinc-100",
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-zinc-200 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"
            onClick={() => {
              const next = mode === "simple" ? "advanced" : "simple";
              setMode(next);
              setModeState(next);
            }}
          >
            <Sparkles className="size-4" />
            {mode === "simple" ? "Switch to Advanced" : "Switch to Simple"}
          </button>
          <NavLink
            to="/settings"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            <LayoutGrid className="size-4" />
            Settings
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900">
              {current.name}
            </h1>
            <p className="text-xs text-zinc-500">{current.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              onClick={() => {
                const next = dark ? "light" : "dark";
                setTheme(next);
                setDark(!dark);
              }}
              title={getTheme()}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {mode === "advanced" ? (
              <a href={DESK} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                  Desk
                </Button>
              </a>
            ) : null}
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-zinc-800">{fullName || "Trustee"}</p>
              <button
                type="button"
                className="text-zinc-500 hover:text-brand-700"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </div>
            <Button
              variant="ghost"
              className="sm:hidden"
              aria-label="Sign out"
              onClick={() => void logout()}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
