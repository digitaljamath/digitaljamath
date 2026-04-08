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
import { Settings, Save, Loader2, DollarSign, Hash, CheckCircle, ArrowLeft, Send, Users, AlertCircle, Wallet, Database } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { fetchWithAuth } from "@/lib/api";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
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



export function SettingsPage() {
    const { refreshConfig } = useConfig();
    const { toast } = useToast();
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



    // Feature Flags
    const [allowManualLedger, setAllowManualLedger] = useState(false);
    const [setupType, setSetupType] = useState('STANDARD');

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



                setAllowManualLedger(data.allow_manual_ledger ?? false);
                setSetupType(data.setup_type || 'STANDARD');
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setIsLoading(false);
        }
    };

    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeedLedger = async () => {
        if (!confirm("This will create default ledgers if they don't exist. Continue?")) return;

        setIsSeeding(true);
        try {
            const res = await fetchWithAuth('/api/ledger/seed/', { method: 'POST' });
            if (res.ok) {
                toast({ title: "Success", description: "Chart of Accounts seeded successfully." });
            } else {
                toast({ title: "Error", description: "Failed to seed ledger.", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Network error.", variant: "destructive" });
        } finally {
            setIsSeeding(false);
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
                {/* System Settings Link (Admin Only - ideally checked via permissions, but always visible for now) */}
                <Button variant="outline" asChild className="mr-2">
                    <Link to="/dashboard/settings/system">
                        <Settings className="h-4 w-4 mr-2" /> System Config
                    </Link>
                </Button>
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

            {/* Interface Preferences - Always visible */}
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


            {/* Data Management - Only for Custom Setup */}
            {setupType === 'CUSTOM' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" /> Data Management
                        </CardTitle>
                        <CardDescription>
                            Advanced tools for system administrators
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-100">
                            <div>
                                <h4 className="font-medium text-yellow-900">Seed Chart of Accounts</h4>
                                <p className="text-sm text-yellow-700">Manually initialize the default ledgers if they are missing.</p>
                            </div>
                            <Button variant="outline" onClick={handleSeedLedger} disabled={isSeeding}>
                                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                                Seed Ledger
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

    );
}
