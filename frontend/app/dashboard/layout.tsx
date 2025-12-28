"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    DollarSign,
    ClipboardCheck,
    Heart,
    BarChart3,
    Settings,
    UserCog,
    Menu,
    X,
    LogOut,
    ChevronDown,
    Inbox,
    Megaphone,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigProvider, useConfig } from "@/context/ConfigContext";
import BasiraChat from "@/components/BasiraChat";

const defaultNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    { name: "Households", href: "/dashboard/households", icon: Users, id: 'households' },
    { name: "Finance", href: "/dashboard/finance", icon: DollarSign, id: 'finance' },
    { name: "Surveys / Tahqeeq", href: "/dashboard/surveys", icon: ClipboardCheck },
    { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    { name: "Welfare (Khidmat)", href: "/dashboard/welfare", icon: Heart },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Staff (Zimmedar)", href: "/dashboard/users", icon: UserCog },
    { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
];

function DashboardInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { config } = useConfig();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/auth/login");
    };

    const navigation = defaultNavigation.map(item => {
        if (item.id === 'households' && config?.household_label) {
            return { ...item, name: `Jamath (${config.household_label})` };
        }
        return item;
    });

    // Fetch pending service requests count
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        async function fetchPendingCount() {
            try {
                const token = localStorage.getItem("access_token");
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const apiBase = `${protocol}//${hostname}:8000`;

                const res = await fetch(`${apiBase}/api/jamath/service-requests/?status=PENDING`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPendingCount(Array.isArray(data) ? data.length : 0);
                }
            } catch (err) {
                console.error("Failed to fetch pending count", err);
            }
        }
        fetchPendingCount();
        // Refresh every 60 seconds
        const interval = setInterval(fetchPendingCount, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                            Project Mizan
                        </h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            // Dashboard should only be active on exact match
                            const isActive = item.href === '/dashboard'
                                ? pathname === '/dashboard'
                                : pathname === item.href || pathname?.startsWith(item.href + '/');

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center px-4 py-3 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }
                                    `}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    <span className="font-medium flex-1">{item.name}</span>
                                    {item.href === '/dashboard/inbox' && pendingCount > 0 && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                            {pendingCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                        A
                                    </div>
                                    <div className="ml-3 text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">admin@masjid.com</p>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <UserCog className="h-4 w-4 mr-3" />
                                        Profile Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 mr-3" />
                                        Logout
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between h-full px-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 flex items-center">
                            {config?.masjid_name && (
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden lg:block">
                                    {config.masjid_name}
                                </h2>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>

            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider>
            <DashboardInner>
                {children}
            </DashboardInner>
            <BasiraChat />
        </ConfigProvider>
    );
}
