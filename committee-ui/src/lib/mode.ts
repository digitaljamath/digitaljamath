const KEY = "dj-committee-mode"; // "simple" | "advanced"
const THEME_KEY = "dj-committee-theme"; // "light" | "dark" | "system"

export type Mode = "simple" | "advanced";

export function getMode(): Mode {
  const v = localStorage.getItem(KEY);
  return v === "advanced" ? "advanced" : "simple";
}

export function setMode(mode: Mode) {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new Event("dj:mode-change"));
}

export function getTheme(): "light" | "dark" | "system" {
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function applyTheme(theme: "light" | "dark" | "system" = getTheme()) {
  localStorage.setItem(THEME_KEY, theme);
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(theme: "light" | "dark" | "system") {
  applyTheme(theme);
}
