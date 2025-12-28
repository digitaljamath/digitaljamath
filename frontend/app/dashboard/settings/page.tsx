"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Settings, Save, Loader2, DollarSign, Hash, Calendar, CheckCircle } from "lucide-react";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Membership Settings
    const [membershipCycle, setMembershipCycle] = useState("ANNUAL");
    const [minimumFee, setMinimumFee] = useState("1200");
    const [currency, setCurrency] = useState("INR");

    // ID Prefix Settings
    const [membershipPrefix, setMembershipPrefix] = useState("JM-");

    // Terminology Settings
    const [masjidName, setMasjidName] = useState("");
    const [householdLabel, setHouseholdLabel] = useState("Gharane");
    const [memberLabel, setMemberLabel] = useState("Afrad");


    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/admin/membership-config/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setMembershipCycle(data.cycle || "ANNUAL");
                setMinimumFee(data.minimum_fee || "1200");
                setCurrency(data.currency || "INR");
                setMembershipPrefix(data.membership_id_prefix || "JM-");
                setMasjidName(data.masjid_name || "");
                setHouseholdLabel(data.household_label || "Gharane");
                setMemberLabel(data.member_label || "Afrad");
            }


        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/admin/membership-config/`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cycle: membershipCycle,
                    minimum_fee: parseFloat(minimumFee),
                    currency,
                    membership_id_prefix: membershipPrefix,
                    masjid_name: masjidName,
                    household_label: householdLabel,
                    member_label: memberLabel
                })


            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Failed to save settings", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-gray-500 mt-1">Configure your Jamath system preferences</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                    ) : saveSuccess ? (
                        <><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Saved!</>
                    ) : (
                        <><Save className="h-4 w-4 mr-2" /> Save Settings</>
                    )}
                </Button>
            </div>

            {/* Membership Fee Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" /> Membership Fee Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure the membership subscription cycle and minimum fee
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Subscription Cycle</Label>
                        <Select value={membershipCycle} onValueChange={setMembershipCycle}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANNUAL">Annual (Yearly)</SelectItem>
                                <SelectItem value="BI_YEARLY">Bi-Yearly (6 Months)</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">How often members need to renew</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Minimum Fee Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <Input
                                type="number"
                                value={minimumFee}
                                onChange={(e) => setMinimumFee(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Required minimum per cycle</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INR">INR (₹)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="AED">AED (د.إ)</SelectItem>
                                <SelectItem value="SAR">SAR (﷼)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Terminology Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" /> Terminology & Branding
                    </CardTitle>
                    <CardDescription>
                        Customize labels and naming to match your local terms
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label>Masjid / Jamath Name</Label>
                        <Input
                            value={masjidName}
                            onChange={(e) => setMasjidName(e.target.value)}
                            placeholder="e.g., Jama Masjid Bangalore"
                        />
                        <p className="text-xs text-gray-500">Displayed on dashboard header</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Household Label (Singular)</Label>
                        <Input
                            value={householdLabel}
                            onChange={(e) => setHouseholdLabel(e.target.value)}
                            placeholder="e.g., Gharane, Family, Khandan"
                        />
                        <p className="text-xs text-gray-500">Default: Gharane</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Member Label (Singular)</Label>
                        <Input
                            value={memberLabel}
                            onChange={(e) => setMemberLabel(e.target.value)}
                            placeholder="e.g., Afrad, Member"
                        />
                        <p className="text-xs text-gray-500">Default: Afrad</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Membership ID Prefix</Label>
                        <Input
                            value={membershipPrefix}
                            onChange={(e) => setMembershipPrefix(e.target.value)}
                            placeholder="e.g., JM-"
                        />
                        <p className="text-xs text-gray-500">Auto-generated IDs: JM-001, JM-002...</p>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" /> Notification Settings
                    </CardTitle>
                    <CardDescription>
                        Configure SMS and WhatsApp notifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <p>SMS/WhatsApp integration settings will be available here.</p>
                        <p className="text-sm mt-2">Configure Twilio or Msg91 API keys for notifications.</p>
                    </div>
                </CardContent>
            </Card>
        </div>

    );
}
