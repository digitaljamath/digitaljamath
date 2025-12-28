"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    User, Receipt, Bell, FileText, LogOut,
    CheckCircle, AlertCircle, Users, Home
} from "lucide-react";

type MembershipStatus = {
    status: string;
    is_active: boolean;
    amount_paid: string;
    minimum_required: string;
    start_date?: string;
    end_date?: string;
};

type Household = {
    id: number;
    membership_id: string;
    address: string;
    economic_status: string;
    housing_status: string;
    member_count: number;
    head_name: string;
    members: any[];
};

export default function PortalDashboardPage() {
    const router = useRouter();
    const [household, setHousehold] = useState<Household | null>(null);
    const [membership, setMembership] = useState<MembershipStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [headName, setHeadName] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/portal/login");
            return;
        }

        setHeadName(localStorage.getItem("head_name") || "Member");
        fetchProfile(token);
    }, [router]);

    const fetchProfile = async (token: string) => {
        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/portal/profile/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.clear();
                router.push("/portal/login");
                return;
            }

            const data = await res.json();
            setHousehold(data.household);
            setMembership(data.membership);
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/portal/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">Digital Jamath</h1>
                        <p className="text-sm text-gray-500">{headName}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                {/* Digital ID Card */}
                <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-blue-200 text-sm">Member ID</p>
                                <p className="text-2xl font-bold tracking-wide">
                                    {household?.membership_id || `#${household?.id}`}
                                </p>
                            </div>
                            <Badge
                                className={`text-sm px-3 py-1 ${membership?.is_active
                                        ? 'bg-green-500 hover:bg-green-500'
                                        : 'bg-red-500 hover:bg-red-500'
                                    }`}
                            >
                                {membership?.is_active ? (
                                    <><CheckCircle className="h-4 w-4 mr-1" /> Active</>
                                ) : (
                                    <><AlertCircle className="h-4 w-4 mr-1" /> {membership?.status}</>
                                )}
                            </Badge>
                        </div>

                        <div className="mt-6 space-y-2">
                            <p className="text-xl font-semibold">{headName}</p>
                            <p className="text-blue-200 text-sm flex items-center">
                                <Home className="h-4 w-4 mr-2" />
                                {household?.address}
                            </p>
                            <p className="text-blue-200 text-sm flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {household?.member_count} Family Members
                            </p>
                        </div>

                        {membership?.end_date && (
                            <div className="mt-4 pt-4 border-t border-blue-500 text-sm text-blue-200">
                                Valid until: {new Date(membership.end_date).toLocaleDateString('en-IN', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/portal/receipts">
                        <Card className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <Receipt className="h-8 w-8 text-green-600 mb-2" />
                                <p className="font-medium">Receipt Vault</p>
                                <p className="text-xs text-gray-500">View & Download</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/portal/announcements">
                        <Card className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <Bell className="h-8 w-8 text-blue-600 mb-2" />
                                <p className="font-medium">Announcements</p>
                                <p className="text-xs text-gray-500">Bulletin Board</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/portal/services">
                        <Card className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                                <p className="font-medium">Service Desk</p>
                                <p className="text-xs text-gray-500">Request Documents</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/portal/family">
                        <Card className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <User className="h-8 w-8 text-orange-600 mb-2" />
                                <p className="font-medium">Family Profile</p>
                                <p className="text-xs text-gray-500">View Members</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Membership Payment Status */}
                {membership && !membership.is_active && (
                    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-amber-800 dark:text-amber-200 text-base flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                Membership Payment Due
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                You have paid ₹{membership.amount_paid} of ₹{membership.minimum_required} required.
                            </p>
                            <Button className="mt-3" size="sm">
                                Pay Now
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
