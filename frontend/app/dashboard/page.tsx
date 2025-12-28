"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Users, DollarSign, ClipboardCheck, TrendingUp, ArrowUpRight, Building2 } from "lucide-react";
import Link from "next/link";

type Stats = {
    households: number;
    members: number;
    transactions: number;
    surveys: number;
    totalIncome: number;
};

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({ households: 0, members: 0, transactions: 0, surveys: 0, totalIncome: 0 });
    const [masjidName, setMasjidName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem("access_token");
                const headers = {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                };
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const apiBase = `${protocol}//${hostname}:8000`;

                // Extract masjid name from subdomain
                const subdomain = hostname.split('.')[0];
                const formattedName = subdomain
                    .split(/[_-]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                setMasjidName(formattedName === 'Demo' ? 'Demo Masjid' : formattedName);

                const [householdsRes, transactionsRes, surveysRes] = await Promise.all([
                    fetch(`${apiBase}/api/jamath/households/`, { headers }),
                    fetch(`${apiBase}/api/finance/transactions/`, { headers }),
                    fetch(`${apiBase}/api/jamath/surveys/`, { headers })
                ]);

                const [households, transactions, surveys] = await Promise.all([
                    householdsRes.json(),
                    transactionsRes.json(),
                    surveysRes.json()
                ]);

                // Validate arrays
                const validHouseholds = Array.isArray(households) ? households : [];
                const validTransactions = Array.isArray(transactions) ? transactions : [];
                const validSurveys = Array.isArray(surveys) ? surveys : [];

                // Count total members
                const totalMembers = validHouseholds.reduce((sum: number, h: any) => sum + (h.member_count || 0), 0);

                const totalIncome = validTransactions
                    .filter((t: any) => !t.is_expense)
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

                setStats({
                    households: validHouseholds.length,
                    members: totalMembers,
                    transactions: validTransactions.length,
                    surveys: validSurveys.length,
                    totalIncome
                });
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
            title: "Active Surveys",
            value: stats.surveys,
            icon: ClipboardCheck,
            color: "from-purple-500 to-pink-500",
            href: "/dashboard/surveys"
        },
        {
            title: "Total Chanda/Zakat",
            value: `₹${stats.totalIncome.toLocaleString()}`,
            icon: TrendingUp,
            color: "from-orange-500 to-red-500",
            href: "/dashboard/finance"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Masjid Name Header */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                <Building2 className="h-8 w-8" />
                <div>
                    <h2 className="text-xl font-bold">{masjidName || "Loading..."}</h2>
                    <p className="text-sm text-blue-100">Dashboard Overview</p>
                </div>
            </div>

            <div>
                <p className="text-gray-500 dark:text-gray-400">
                    Welcome back! Here's what's happening with your community.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Link key={index} href={stat.href}>
                        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:-translate-y-1">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} text-white`}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
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
            <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Link href="/dashboard/households/new">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer">
                            <Users className="h-8 w-8 text-blue-500 mb-2" />
                            <h3 className="font-semibold">Add Household</h3>
                            <p className="text-sm text-gray-500">Register a new family</p>
                        </div>
                    </Link>
                    <Link href="/dashboard/finance/new">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer">
                            <DollarSign className="h-8 w-8 text-emerald-500 mb-2" />
                            <h3 className="font-semibold">Record Transaction</h3>
                            <p className="text-sm text-gray-500">Log income or expense</p>
                        </div>
                    </Link>
                    <Link href="/dashboard/surveys/builder">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer">
                            <ClipboardCheck className="h-8 w-8 text-purple-500 mb-2" />
                            <h3 className="font-semibold">Create Survey</h3>
                            <p className="text-sm text-gray-500">Build a new form</p>
                        </div>
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Activity Placeholder */}
            <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <p>Activity feed coming soon...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
