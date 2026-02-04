import { getApiBaseUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Users, DollarSign, AlertCircle, TrendingUp, ArrowUpRight, Receipt, UserPlus, Clock } from "lucide-react";
import { Link } from "react-router-dom";

type Stats = {
    households: number;
    members: number;
    transactions: number;
    pendingRenewals: number;
    totalIncome: number;
};

type ActivityItem = {
    id: string;
    type: 'transaction' | 'household' | 'member';
    title: string;
    description: string;
    amount?: number;
    timestamp: string;
};

export function DashboardHome() {
    const [stats, setStats] = useState<Stats>({ households: 0, members: 0, transactions: 0, pendingRenewals: 0, totalIncome: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem("access_token");
                const headers = {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                };

                const apiBase = getApiBaseUrl();

                const [householdsRes, transactionsRes] = await Promise.all([
                    fetch(`${apiBase}/api/jamath/households/`, { headers }),
                    fetch(`${apiBase}/api/ledger/journal-entries/`, { headers })
                ]);

                const [households, transactions] = await Promise.all([
                    householdsRes.json(),
                    transactionsRes.json()
                ]);

                const validHouseholds = Array.isArray(households) ? households : [];
                // Journal entries response might be paginated, check structure
                const entriesList = transactions.results ? transactions.results : (Array.isArray(transactions) ? transactions : []);

                const totalMembers = validHouseholds.reduce((sum: number, h: any) => sum + (h.member_count || 0), 0);

                // Count households with expired or missing subscriptions
                const pendingRenewals = validHouseholds.filter((h: any) => !h.is_membership_active).length;

                // Calculate income from Receipt Vouchers
                const totalIncome = entriesList
                    .filter((t: any) => t.voucher_type === 'RECEIPT')
                    .reduce((sum: number, t: any) => sum + parseFloat(t.total_amount || 0), 0);

                setStats({
                    households: validHouseholds.length,
                    members: totalMembers,
                    transactions: entriesList.length,
                    pendingRenewals,
                    totalIncome
                });

                // Build recent activity from transactions
                const activities: ActivityItem[] = [];

                // Add recent transactions (last 5)
                entriesList.slice(0, 5).forEach((t: any) => {
                    activities.push({
                        id: `txn-${t.id}`,
                        type: 'transaction',
                        title: t.voucher_type === 'RECEIPT' ? 'Payment Received' : (t.voucher_type === 'PAYMENT' ? 'Payment Made' : 'Journal Entry'),
                        description: t.narration || (t.donor_name_manual || 'Transaction recorded'),
                        amount: parseFloat(t.total_amount || 0),
                        timestamp: t.date
                    });
                });

                // Add recent households (last 3)
                validHouseholds.slice(-3).reverse().forEach((h: any) => {
                    activities.push({
                        id: `hh-${h.id}`,
                        type: 'household',
                        title: 'New Household Registered',
                        description: h.head_name || `Household #${h.membership_id}`,
                        timestamp: h.created_at || new Date().toISOString()
                    });
                });

                // Sort by timestamp descending and take top 6
                activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setRecentActivity(activities.slice(0, 6));

            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Gharane (Families)",
            value: stats.households,
            icon: Users,
            color: "from-blue-500 to-cyan-500",
            href: "/dashboard/households"
        },
        {
            title: "Total Transactions",
            value: stats.transactions,
            icon: DollarSign,
            color: "from-emerald-500 to-teal-500",
            href: "/dashboard/finance"
        },
        {
            title: "Pending Renewals",
            value: stats.pendingRenewals,
            icon: AlertCircle,
            color: "from-amber-500 to-orange-500",
            href: "/dashboard/households"
        },
        {
            title: "Total Chanda/Zakat",
            value: `₹${stats.totalIncome.toLocaleString()}`,
            icon: TrendingUp,
            color: "from-orange-500 to-red-500",
            href: "/dashboard/finance"
        }
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'transaction': return <Receipt className="h-4 w-4 text-emerald-500" />;
            case 'household': return <UserPlus className="h-4 w-4 text-blue-500" />;
            case 'member': return <Users className="h-4 w-4 text-purple-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">
                    Welcome back! Here's what's happening with your community.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Link key={index} to={stat.href}>
                        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-1">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} text-white`}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {isLoading ? "..." : stat.value}
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Link to="/dashboard/households/new">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                            <Users className="h-8 w-8 text-blue-500 mb-2" />
                            <h3 className="font-semibold">Add Household</h3>
                            <p className="text-sm text-gray-500">Register a new family</p>
                        </div>
                    </Link>
                    <Link to="/dashboard/finance/new">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer">
                            <DollarSign className="h-8 w-8 text-emerald-500 mb-2" />
                            <h3 className="font-semibold">Record Transaction</h3>
                            <p className="text-sm text-gray-500">Log income or expense</p>
                        </div>
                    </Link>
                    <Link to="/dashboard/reminders">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50 transition-all cursor-pointer">
                            <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                            <h3 className="font-semibold">Send Reminder</h3>
                            <p className="text-sm text-gray-500">Notify pending renewals</p>
                        </div>
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                            <p>Loading activity...</p>
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No recent activity yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-2 rounded-full bg-gray-100">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                                        <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {activity.amount && (
                                            <p className="font-semibold text-emerald-600">₹{activity.amount.toLocaleString()}</p>
                                        )}
                                        <p className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
