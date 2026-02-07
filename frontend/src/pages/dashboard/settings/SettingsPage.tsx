import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Settings, Save, Loader2, DollarSign, Hash, CheckCircle, ArrowLeft, Send, Users, AlertCircle, Wallet } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { fetchWithAuth } from "@/lib/api";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// ... (keep existing TelegramStatsPanel code if any, but we are just targeting the import and the button location.
// Actually, I can't easily skip lines in replacement content for imports if I'm targeting a large block.
// I'll do two separate replacements.)

/* I will split this into two tool calls or use multi_replace if I can.
   Wait, replace_file_content rules say: "Use this tool ONLY when you are making a SINGLE CONTIGUOUS block of edits".
   I need to make two non-adjacent edits (imports and the button).
   So I should use `multi_replace_file_content`.
*/

// Telegram Stats & Actions Panel
function TelegramStatsPanel() {
    const [stats, setStats] = useState<{ total_households: number; telegram_linked: number; pending_renewals: number; link_percentage: number } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetchWithAuth('/api/telegram/stats/');
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch Telegram stats", err);
        }
    };

    const sendReminders = async () => {
        setIsSending(true);
        setResult(null);
        try {
            const res = await fetchWithAuth('/api/telegram/payment-reminders/', {
                method: 'POST',
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (res.ok) {
                setResult(`✅ Sent ${data.sent} reminders. (${data.skipped} skipped - no Telegram)`);
            } else {
                setResult(`❌ Error: ${data.error || 'Failed'}`);
            }
        } catch (err) {
            setResult('❌ Network error');
        } finally {
            setIsSending(false);
        }
    };

    if (!stats) {
        return <div className="text-center py-4 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{stats.telegram_linked}</p>
                    <p className="text-xs text-blue-600">Linked on Telegram</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                    <p className="text-2xl font-bold text-amber-700">{stats.pending_renewals}</p>
                    <p className="text-xs text-amber-600">Pending Renewals</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-2xl font-bold text-emerald-700">{stats.link_percentage}%</p>
                    <p className="text-xs text-emerald-600">Coverage</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t">
                <Button
                    onClick={sendReminders}
                    disabled={isSending}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Payment Reminders
                </Button>
            </div>

            {result && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-center">
                    {result}
                </div>
            )}

            <p className="text-xs text-gray-500 text-center">
                Members must link their Telegram from the Member Portal login page to receive notifications.
            </p>
        </div>
    );
}

export function SettingsPage() {
    const { refreshConfig } = useConfig();
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

    // Payment & Org Settings
    const [paymentProvider, setPaymentProvider] = useState("NONE");
    const [razorpayKey, setRazorpayKey] = useState("");
    const [razorpaySecret, setRazorpaySecret] = useState("");
    const [cashfreeAppId, setCashfreeAppId] = useState("");
    const [cashfreeSecret, setCashfreeSecret] = useState("");

    const [orgName, setOrgName] = useState("");
    const [orgAddress, setOrgAddress] = useState("");
    const [orgPan, setOrgPan] = useState("");
    const [reg80g, setReg80g] = useState("");

    // Telegram Settings
    const [telegramEnabled, setTelegramEnabled] = useState(true);
    const [telegramAutoReminders, setTelegramAutoReminders] = useState(false);
    const [telegramProfileUpdates, setTelegramProfileUpdates] = useState(true);
    const [telegramAnnouncements, setTelegramAnnouncements] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetchWithAuth('/api/admin/membership-config/');

            if (res.ok) {
                const data = await res.json();
                setMembershipCycle(data.cycle || "ANNUAL");
                setMinimumFee(data.minimum_fee || "1200");
                setCurrency(data.currency || "INR");
                setMembershipPrefix(data.membership_id_prefix || "JM-");
                setMasjidName(data.masjid_name || "");
                setHouseholdLabel(data.household_label || "Gharane");
                setMemberLabel(data.member_label || "Afrad");

                setPaymentProvider(data.payment_gateway_provider || "NONE");
                setRazorpayKey(data.razorpay_key_id || "");
                setRazorpaySecret(data.razorpay_key_secret || "");
                setCashfreeAppId(data.cashfree_app_id || "");
                setCashfreeSecret(data.cashfree_secret_key || "");

                setOrgName(data.organization_name || "");
                setOrgAddress(data.organization_address || "");
                setOrgPan(data.organization_pan || "");
                setReg80g(data.registration_number_80g || "");

                setTelegramEnabled(data.telegram_enabled ?? true);
                setTelegramAutoReminders(data.telegram_auto_reminders ?? false);
                setTelegramProfileUpdates(data.telegram_notify_profile_updates ?? true);
                setTelegramAnnouncements(data.telegram_notify_announcements ?? false);
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
            const res = await fetchWithAuth('/api/admin/membership-config/', {
                method: "PUT",
                body: JSON.stringify({
                    cycle: membershipCycle,
                    minimum_fee: parseFloat(minimumFee),
                    currency,
                    membership_id_prefix: membershipPrefix,
                    masjid_name: masjidName,
                    household_label: householdLabel,
                    member_label: memberLabel,

                    payment_gateway_provider: paymentProvider,
                    razorpay_key_id: razorpayKey,
                    razorpay_key_secret: razorpaySecret,
                    cashfree_app_id: cashfreeAppId,
                    cashfree_secret_key: cashfreeSecret,

                    organization_name: orgName,
                    organization_address: orgAddress,
                    organization_pan: orgPan,
                    registration_number_80g: reg80g,

                    telegram_enabled: telegramEnabled,
                    telegram_auto_reminders: telegramAutoReminders,
                    telegram_notify_profile_updates: telegramProfileUpdates,
                    telegram_notify_announcements: telegramAnnouncements
                })
            });

            if (res.ok) {
                setSaveSuccess(true);
                refreshConfig();
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1">
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

            {/* Interface Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" /> Interface Preferences
                    </CardTitle>
                    <CardDescription>
                        Customize your personal dashboard experience
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Finance Mode</Label>
                            <p className="text-xs text-gray-500">
                                Choose "Advanced" to see Ledger & Journal controls.
                            </p>
                        </div>
                        <Select
                            value={localStorage.getItem("financeMode") || "SIMPLE"}
                            onValueChange={(val) => {
                                localStorage.setItem("financeMode", val);
                                // Force re-render not needed as we just set it, but we might want a toast
                                window.dispatchEvent(new Event("storage")); // Notify listeners if any
                                setSaveSuccess(true); // Reuse save indication
                                setTimeout(() => setSaveSuccess(false), 2000);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SIMPLE">Simple (Recommended)</SelectItem>
                                <SelectItem value="ADVANCED">Accountant (Advanced)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Gateway Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" /> Payment Gateway Integration
                    </CardTitle>
                    <CardDescription>
                        Configure online payments for membership fees and donations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Payment Provider</Label>
                        <Select value={paymentProvider} onValueChange={setPaymentProvider}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">Disabled</SelectItem>
                                <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                                <SelectItem value="CASHFREE">Cashfree Payments</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentProvider === 'RAZORPAY' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r">
                            <div className="space-y-2">
                                <Label>Razorpay Key ID</Label>
                                <Input value={razorpayKey} onChange={e => setRazorpayKey(e.target.value)} type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label>Razorpay Key Secret</Label>
                                <Input value={razorpaySecret} onChange={e => setRazorpaySecret(e.target.value)} type="password" />
                            </div>
                        </div>
                    )}

                    {paymentProvider === 'CASHFREE' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-amber-500 pl-4 py-2 bg-amber-50/50 rounded-r">
                            <div className="space-y-2">
                                <Label>Cashfree App ID</Label>
                                <Input value={cashfreeAppId} onChange={e => setCashfreeAppId(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cashfree Secret Key</Label>
                                <Input value={cashfreeSecret} onChange={e => setCashfreeSecret(e.target.value)} type="password" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Organization Details (80G) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" /> Organization Details & 80G
                    </CardTitle>
                    <CardDescription>
                        These details will be printed on payment receipts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Legal Organization Name</Label>
                            <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Jama Masjid Trust" />
                        </div>
                        <div className="space-y-2">
                            <Label>PAN Number</Label>
                            <Input value={orgPan} onChange={e => setOrgPan(e.target.value)} placeholder="AAAAA0000A" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Registered Address</Label>
                        <Input value={orgAddress} onChange={e => setOrgAddress(e.target.value)} placeholder="Full Address" />
                    </div>
                    <div className="space-y-2">
                        <Label>80G Registration Number</Label>
                        <Input value={reg80g} onChange={e => setReg80g(e.target.value)} placeholder="Registration No." />
                    </div>
                </CardContent>
            </Card>

            {/* Telegram Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" /> Telegram Notifications
                    </CardTitle>
                    <CardDescription>
                        Send announcements and payment reminders via Telegram
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Settings Toggles */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Telegram Notifications</Label>
                                <p className="text-xs text-gray-500">Master switch for all Telegram features</p>
                            </div>
                            <Switch checked={telegramEnabled} onCheckedChange={setTelegramEnabled} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Notify on Profile Updates</Label>
                                <p className="text-xs text-gray-500">Send notification when member profile is edited</p>
                            </div>
                            <Switch checked={telegramProfileUpdates} onCheckedChange={setTelegramProfileUpdates} disabled={!telegramEnabled} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Auto-broadcast Announcements</Label>
                                <p className="text-xs text-gray-500">Send to Telegram when announcement is published</p>
                            </div>
                            <Switch checked={telegramAnnouncements} onCheckedChange={setTelegramAnnouncements} disabled={!telegramEnabled} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Auto Payment Reminders (Cron)</Label>
                                <p className="text-xs text-gray-500">Automatically send reminders via scheduled job</p>
                            </div>
                            <Switch checked={telegramAutoReminders} onCheckedChange={setTelegramAutoReminders} disabled={!telegramEnabled} />
                        </div>
                    </div>

                    <hr />

                    {/* Stats + Manual Actions */}
                    <TelegramStatsPanel />
                </CardContent>
            </Card>
        </div>

    );
}
