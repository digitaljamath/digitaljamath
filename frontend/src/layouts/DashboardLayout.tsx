import { getApiBaseUrl, getLandingPageUrl } from "@/lib/config";
import logo from "@/assets/logo.png";
import { useRbac } from "@/context/RbacContext";
import { useLocation, useNavigate, Link, Outlet } from "react-router-dom";
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
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigProvider, useConfig } from "@/context/ConfigContext";
import { RbacProvider } from "@/context/RbacContext";

const APP_VERSION = "1.1.12";

const defaultNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    { name: "Households", href: "/dashboard/households", icon: Users, id: 'households' },
    { name: "Baitul Maal (Finance)", href: "/dashboard/finance", icon: DollarSign, id: 'finance' },
    { name: "Basira AI", href: "/dashboard/basira", icon: Sparkles },
    // { name: "Surveys / Tahqeeq", href: "/dashboard/surveys", icon: ClipboardCheck },
    { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone, id: 'announcements' },
    // { name: "Welfare (Khidmat)", href: "/dashboard/welfare", icon: Heart },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, id: 'settings' },
    { name: "Staff (Zimmedar)", href: "/dashboard/users", icon: UserCog, id: 'users' },
];

function DashboardInner() {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { config } = useConfig();
    const { hasPermission, user } = useRbac();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/auth/signin");
    };

    const navigation = defaultNavigation.filter(item => {
        // Always show Dashboard, Inbox, Basira
        if (item.href === '/dashboard' || item.href === '/dashboard/inbox' || item.href === '/dashboard/basira') return true;

        // Permission-based filtering
        if (item.id === 'households') {
            const allowed = hasPermission('jamath');
            console.log(`RBAC Check: Households (jamath) -> ${allowed}`);
            return allowed;
        }
        if (item.id === 'finance') return hasPermission('finance');
        if (item.id === 'welfare') return hasPermission('welfare');
        if (item.id === 'announcements') return hasPermission('announcements');
        if (item.id === 'settings') return hasPermission('settings');
        if (item.id === 'users') return hasPermission('users');

        return true;
    }).map(item => {
        if (item.id === 'households' && config?.household_label) {
            return { ...item, name: `Jamath (${config.household_label})` };
        }
        return item;
    });

    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        async function fetchPendingCount() {
            try {
                const token = localStorage.getItem("access_token");
                const apiBase = getApiBaseUrl();
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
        const interval = setInterval(fetchPendingCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user?.username || 'User';

    const displayEmail = user?.email || 'user@example.com';
    const displayInitials = getInitials(displayName) || 'U';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-72 transform transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${sidebarOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.1)]' : '-translate-x-full'}
                lg:translate-x-0
                bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-20 px-8 border-b border-slate-200/50">
                        <a href={getLandingPageUrl()} className="flex items-center justify-center font-extrabold text-xl gap-2 text-slate-900 tracking-tight hover:opacity-90 transition-opacity">
                            <img src={logo} alt="DigitalJamath Logo" className="h-8 w-8 drop-shadow-sm" />
                            <span>Digital<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Jamath</span></span>
                        </a>
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
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                        <div className="px-4 mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">Menu</div>
                        {navigation.map((item) => {
                            const isActive = item.href === '/dashboard'
                                ? pathname === '/dashboard'
                                : pathname === item.href || pathname?.startsWith(item.href + '/');

                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group
                                        ${isActive
                                            ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_16px_-4px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_20px_-4px_rgba(79,70,229,0.4)] hover:-translate-y-0.5'
                                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                        }
                                    `}
                                >
                                    <item.icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110 text-white/90' : 'text-slate-400 group-hover:text-blue-600 group-hover:scale-110'}`} />
                                    <span className="font-semibold text-[15px] flex-1 tracking-tight">{item.href === '/dashboard/households' ? `Jamath (${config?.household_label || 'Gharane'})` : item.name}</span>
                                    {item.href === '/dashboard/inbox' && pendingCount > 0 && (
                                        <span className="ml-2 px-2.5 py-0.5 text-xs font-bold bg-white text-blue-600 rounded-full shadow-sm">
                                            {pendingCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center overflow-hidden">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                                        {displayInitials}
                                    </div>
                                    <div className="ml-3 text-left overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">{displayName}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[100px]">{displayEmail}</p>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    <Link
                                        to="/dashboard/profile"
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <UserCog className="h-4 w-4 mr-3" />
                                        Profile Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 mr-3" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-4 py-2 text-xs text-center text-gray-400 border-t border-gray-100">
                        v{APP_VERSION} • DigitalJamath
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200">
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
                                <h2 className="text-lg font-semibold text-gray-800 hidden lg:block">
                                    {config.masjid_name}
                                </h2>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6 pt-4">
                    {window.location.hostname.startsWith('demo.') && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800 font-medium">
                                <strong>Important:</strong> You are in a demo environment. For security and quality, all sample data is <strong>automatically reset every 24 hours</strong>.
                            </p>
                        </div>
                    )}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function DashboardLayout() {
    return (
        <ConfigProvider>
            <RbacProvider>
                <DashboardInner />
            </RbacProvider>
        </ConfigProvider>
    );
}
