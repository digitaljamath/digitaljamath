/** Thin Frappe API client — session cookie + CSRF (injected by www/jamath.py). */

function csrfToken(): string | undefined {
  const t = (window as unknown as { csrf_token?: string }).csrf_token;
  return t && t !== "None" ? t : undefined;
}

async function doFetch(path: string, init?: RequestInit) {
  const token = csrfToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { "X-Frappe-CSRF-Token": token } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      window.dispatchEvent(new Event("dj:auth-error"));
    }
    throw Object.assign(new Error(`${path} failed (${res.status})`), {
      status: res.status,
      body,
    });
  }
  return res.json();
}

export async function call<T = unknown>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const data = await doFetch(`/api/method/${method}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
  return (data.message ?? data) as T;
}

export async function login(usr: string, pwd: string) {
  await doFetch("/api/method/login", {
    method: "POST",
    body: JSON.stringify({ usr, pwd }),
  });
}

export async function logout() {
  await doFetch("/api/method/logout", { method: "POST" });
}

export type LoggedUser = {
  message: string;
  full_name?: string;
  user?: string;
};

export async function getLoggedUser(): Promise<LoggedUser | null> {
  try {
    const data = await doFetch("/api/method/frappe.auth.get_logged_user");
    const user = data.message as string;
    if (!user || user === "Guest") return null;
    return { message: user, user, full_name: user };
  } catch {
    return null;
  }
}

export async function getUserInfo(): Promise<{ full_name: string; email: string } | null> {
  try {
    const user = await call<string>("frappe.auth.get_logged_user");
    if (!user || user === "Guest") return null;
    const doc = await call<{ full_name?: string; email?: string; name?: string }>(
      "frappe.client.get",
      { doctype: "User", name: user },
    );
    return {
      full_name: doc.full_name || user,
      email: doc.email || doc.name || user,
    };
  } catch {
    return null;
  }
}

export type ListRow = Record<string, unknown> & { name: string };

export async function getList(
  doctype: string,
  fields: string[],
  opts: {
    filters?: unknown[];
    order_by?: string;
    limit_page_length?: number;
  } = {},
): Promise<ListRow[]> {
  const rows = await call<ListRow[]>("frappe.client.get_list", {
    doctype,
    fields,
    filters: opts.filters || [],
    order_by: opts.order_by || "modified desc",
    limit_page_length: opts.limit_page_length ?? 50,
  });
  return Array.isArray(rows) ? rows : [];
}

export function deskPath(doctype: string, name?: string): string {
  const slug = doctype.toLowerCase().replace(/ /g, "-");
  const base = import.meta.env.PROD ? "" : "http://127.0.0.1:8000";
  return name ? `${base}/app/${slug}/${encodeURIComponent(name)}` : `${base}/app/${slug}`;
}
