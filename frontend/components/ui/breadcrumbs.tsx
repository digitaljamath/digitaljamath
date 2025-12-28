"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Map of path segments to readable names
const pathNames: Record<string, string> = {
    dashboard: "Dashboard",
    households: "Jamath (Families)",
    finance: "Baitul Maal",
    surveys: "Surveys",
    welfare: "Welfare",
    reports: "Reports",
    settings: "Settings",
    users: "Staff",
    new: "New",
    edit: "Edit",
    builder: "Builder",
};

export function Breadcrumbs() {
    const pathname = usePathname();

    if (!pathname || pathname === "/dashboard") {
        return null; // Don't show breadcrumbs on dashboard home
    }

    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb items
    const items: { name: string; href: string; isLast: boolean }[] = [];
    let currentPath = "";

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Check if it's an ID (numeric or UUID-like)
        const isId = /^\d+$/.test(segment) || /^[a-f0-9-]{36}$/i.test(segment);

        // Get display name
        let name = pathNames[segment] || segment;
        if (isId) {
            name = `#${segment}`;
        }

        items.push({
            name,
            href: currentPath,
            isLast: index === segments.length - 1
        });
    });

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-blue-600 transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>

            {items.map((item, index) => (
                <div key={item.href} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-300" />
                    {item.isLast ? (
                        <span className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                        </span>
                    ) : (
                        <Link
                            href={item.href}
                            className="hover:text-blue-600 transition-colors"
                        >
                            {item.name}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
