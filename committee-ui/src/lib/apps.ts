/**
 * Committee console navigation — Kamra-style app suite.
 *
 * Simple mode: jamath-first apps only.
 * Advanced mode: same apps + escape hatch to full ERPNext Desk (/app).
 */

import type { ComponentType } from "react";
import {
  BookOpen,
  Building2,
  ClipboardList,
  ExternalLink,
  HandHeart,
  Home,
  Landmark,
  Settings as SettingsIcon,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

export interface AppNavItem {
  to?: string;
  href?: string;
  label: string;
  icon: Icon;
  group?: string;
  advancedOnly?: boolean;
}

export interface AppDef {
  id: string;
  name: string;
  description: string;
  icon: Icon;
  items: AppNavItem[];
  extraPrefixes?: string[];
}

const DESK = import.meta.env.PROD ? "" : "http://127.0.0.1:8000";

export const APPS: AppDef[] = [
  {
    id: "home",
    name: "Home",
    description: "Today’s jamath overview",
    icon: Home,
    items: [{ to: "/", label: "Overview", icon: Home }],
  },
  {
    id: "community",
    name: "Community",
    description: "Households, members, subscriptions",
    icon: Users,
    items: [
      { to: "/community/households", label: "Households", icon: Users, group: "Census" },
      { to: "/community/members", label: "Members", icon: Users, group: "Census" },
      {
        to: "/community/subscriptions",
        label: "Subscriptions",
        icon: ClipboardList,
        group: "Census",
      },
    ],
    extraPrefixes: ["/community"],
  },
  {
    id: "baitul-maal",
    name: "Baitul Maal",
    description: "Funds, receipts, ledger",
    icon: Wallet,
    items: [
      { to: "/funds/types", label: "Fund types", icon: Landmark, group: "Funds" },
      { to: "/funds/payments", label: "Payments", icon: Wallet, group: "Collections" },
      { to: "/funds/journal", label: "Ledger entries", icon: BookOpen, group: "Books" },
      {
        href: `${DESK}/app/chart-of-accounts`,
        label: "Chart of Accounts",
        icon: ExternalLink,
        group: "Books",
        advancedOnly: true,
      },
    ],
    extraPrefixes: ["/funds"],
  },
  {
    id: "services",
    name: "Services",
    description: "Tickets and announcements",
    icon: Ticket,
    items: [
      { to: "/services/tickets", label: "Service tickets", icon: Ticket },
      { to: "/services/announcements", label: "Announcements", icon: Building2 },
    ],
    extraPrefixes: ["/services"],
  },
  {
    id: "welfare",
    name: "Welfare",
    description: "Zakat grants, staff, compliance",
    icon: HandHeart,
    items: [
      { to: "/welfare/grants", label: "Zakat / grants", icon: HandHeart, group: "Welfare" },
      { to: "/welfare/staff", label: "Staff & payroll", icon: Users, group: "Ops" },
      {
        to: "/welfare/compliance",
        label: "Compliance checklist",
        icon: ClipboardList,
        group: "Ops",
      },
    ],
    extraPrefixes: ["/welfare"],
  },
  {
    id: "settings",
    name: "Settings",
    description: "Jamath setup and Advanced Desk",
    icon: SettingsIcon,
    items: [
      { to: "/settings", label: "Jamath settings", icon: SettingsIcon },
      {
        href: `${DESK}/app`,
        label: "Advanced · ERPNext Desk",
        icon: ExternalLink,
        group: "Advanced",
      },
    ],
  },
];

export function appForPath(pathname: string): AppDef {
  const path = pathname.replace(/\/$/, "") || "/";
  for (const app of APPS) {
    if (app.id === "home" && path === "/") return app;
    if (app.items.some((i) => i.to && path.startsWith(i.to))) return app;
    if (app.extraPrefixes?.some((p) => path.startsWith(p))) return app;
  }
  return APPS[0];
}

export function visibleItems(app: AppDef, advanced: boolean): AppNavItem[] {
  return app.items.filter((i) => advanced || !i.advancedOnly);
}
