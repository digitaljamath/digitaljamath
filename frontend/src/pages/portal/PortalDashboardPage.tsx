
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    User, Receipt, Bell, FileText, LogOut,
    CheckCircle, AlertCircle, Users, Home, Loader2, CreditCard
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { getApiBaseUrl } from "@/lib/config";

// --- Types ---
type MembershipStatus = {
    status: string;
    is_active: boolean;
    amount_paid: string;
    minimum_required: string;
    start_date?: string;
    end_date?: string;
};

type Member = {
    id: number;
    full_name: string;
    is_head_of_family: boolean;
    relationship_to_head: string;
};

type Household = {
    id: number;
    membership_id: string;
    address: string;
    economic_status: string;
    housing_status: string;
    member_count: number;
    head_name: string;
    members: Member[];
    phone_number?: string;
};

export function PortalDashboardPage() {
    const navigate = useNavigate();
    const [household, setHousehold] = useState<Household | null>(null);
    const [membership, setMembership] = useState<MembershipStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [headName, setHeadName] = useState("");

    // For Payment Integration
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [extraCharity, setExtraCharity] = useState(0);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    // 80G Logic
    const [need80G, setNeed80G] = useState(false);
    const [donorPan, setDonorPan] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/portal/login");
            return;
        }

        // Check for Return URL (Cashfree)
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order_id');
        const panParam = params.get('pan');

        if (orderId) {
            // Clear URL params to avoid re-trigger
            window.history.replaceState({}, '', window.location.pathname);
            verifyCashfree(orderId, panParam || "", token);
        }

        setHeadName(localStorage.getItem("head_name") || "Member");
        fetchProfile(token);
    }, [navigate]);

    const verifyCashfree = async (orderId: string, pan: string, token: string) => {
        setIsPaymentLoading(true);
        const apiBase = getApiBaseUrl();
        try {
            const verifyRes = await fetch(`${apiBase}/api/portal/payment/verify/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    order_id: orderId,
                    donor_pan: pan
                })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
                alert("Payment Successful! Receipt Generated: " + verifyData.receipt);
                // fetchProfile call handled by useEffect or manually called?
                // profile fetch happens in useEffect anyway if component mounts, but here just alert.
                window.location.reload(); // Simple reload to refresh data
            } else {
                alert("Payment verification failed: " + verifyData.error);
            }
        } catch (err) {
            alert("Payment verification error");
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const fetchProfile = async (token: string) => {
        try {
            const apiBase = getApiBaseUrl();

            const res = await fetch(`${apiBase}/api/portal/profile/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.clear();
                navigate("/portal/login");
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setHousehold(data.household);
                setMembership(data.membership);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/portal/login");
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const loadCashfree = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setIsPaymentLoading(true);

        // Validate 80G PAN
        if (need80G && !donorPan) {
            alert("Please enter PAN Number for 80G receipt.");
            setIsPaymentLoading(false);
            return;
        }

        const token = localStorage.getItem("access_token");
        const apiBase = getApiBaseUrl();

        // Calculate total
        const due = membership ? Math.max(0, parseFloat(membership.minimum_required) - parseFloat(membership.amount_paid)) : 0;
        const total = due + extraCharity;

        if (total <= 0) {
            alert("Amount must be greater than 0");
            setIsPaymentLoading(false);
            return;
        }

        try {
            // 1. Create Order
            const orderRes = await fetch(`${apiBase}/api/portal/payment/create-order/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: total,
                    donor_pan: donorPan
                })
            });

            if (!orderRes.ok) throw new Error("Failed to create order");
            const orderData = await orderRes.json();

            // CHECK PROVIDER
            if (orderData.provider === 'CASHFREE') {
                const res = await loadCashfree();
                if (!res) { alert("Cashfree SDK failed to load"); setIsPaymentLoading(false); return; }

                const cashfree = new (window as any).Cashfree({ mode: orderData.env === 'SANDBOX' ? "sandbox" : "production" });
                cashfree.checkout({
                    paymentSessionId: orderData.payment_session_id,
                    redirectTarget: "_self"
                });
                // Return, page will redirect
                return;

            } else {
                // RAZORPAY (Default)
                const res = await loadRazorpay();
                if (!res) { alert("Razorpay SDK failed"); setIsPaymentLoading(false); return; }

                const options = {
                    key: orderData.key_id,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "Digital Jamath",
                    description: "Membership Payment",
                    image: "/logo.png",
                    order_id: orderData.order_id,
                    handler: async function (response: any) {
                        // 3. Verify Payment
                        try {
                            const verifyRes = await fetch(`${apiBase}/api/portal/payment/verify/`, {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    amount: total, // Send total logic
                                    donor_pan: donorPan
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyData.status === 'success') {
                                alert("Payment Successful! Receipt Generated: " + verifyData.receipt);
                                setIsPaymentOpen(false);
                                fetchProfile(token!); // Reload profile
                            } else {
                                alert("Payment verification failed: " + verifyData.error);
                            }
                        } catch (err) {
                            alert("Payment verification error");
                        }
                    },
                    prefill: {
                        name: household?.head_name,
                        contact: household?.phone_number || '', // could add phone
                        email: ''
                    },
                    theme: {
                        color: "#2563EB"
                    }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
            }

        } catch (err) {
            console.error(err);
            alert("Payment initiation failed. Please check gateway configuration.");
        } finally {
            // Note: If Cashfree redirects, this finally might run before unload? 
            if ((window as any).Cashfree) {
                // Keep loading true if redirecting
            } else {
                setIsPaymentLoading(false);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!household) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <p className="text-gray-500">Failed to load profile.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
        );
    }

    // Logic for Due Amount
    const amountDue = membership ? Math.max(0, parseFloat(membership.minimum_required) - parseFloat(membership.amount_paid)) : 0;
    const totalAmount = amountDue + extraCharity;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header / App Bar */}
            <header className="bg-white border-b sticky top-0 z-50 h-[56px] flex items-center shadow-sm">
                <div className="w-full max-w-[420px] mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-6 w-6" />
                        <h1 className="font-bold text-lg tracking-tight text-gray-900">Digital Jamath</h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="w-full max-w-[420px] mx-auto px-4 py-6 space-y-6 flex-1">

                {/* 1. Membership Status Card */}
                {membership && (
                    <Card className={`shadow-sm scale-110 border-0 ${!membership.is_active && amountDue > 0 ? 'bg-amber-50' : 'bg-gray-50/50'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Membership Status</h3>
                                <div className="flex gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full px-3 h-6 border-0 ${membership.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                    >
                                        <span className="flex items-center gap-1">
                                            <div className={`h-1.5 w-1.5 rounded-full ${membership.is_active ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            {membership.is_active ? 'Active' : 'Expired'}
                                        </span>
                                    </Badge>
                                    {amountDue === 0 && (
                                        <Badge variant="outline" className="rounded-full px-3 h-6 bg-blue-100 text-blue-700 border-0">
                                            No Dues
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {amountDue > 0 && (
                                <div className="flex items-end justify-between mb-4 animate-in fade-in duration-500">
                                    <div>
                                        <p className="text-[12px] text-gray-500 font-medium">Amount Due</p>
                                        <p className="text-2xl font-bold text-gray-900 leading-tight">₹{amountDue}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Required</p>
                                        <p className="text-sm font-bold text-gray-600">₹{membership.minimum_required}</p>
                                    </div>
                                </div>
                            )}

                            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        className={`w-full h-12 rounded-[14px] font-bold text-base active:scale-95 transition-all shadow-md ${!membership.is_active && amountDue > 0
                                            ? 'bg-amber-500 hover:bg-amber-600'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {amountDue > 0 ? "Pay Now" : "Make a Donation"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-t-[24px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg">{amountDue > 0 ? "Processing Payment" : "Make a Donation"}</DialogTitle>
                                        <DialogDescription className="text-xs">
                                            Secure and encrypted transaction via Razorpay/Cashfree.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        <Card className="border-0 shadow-inner p-4 bg-gray-50 rounded-2xl">
                                            {amountDue > 0 && (
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-500">Membership Fee</span>
                                                    <span className="font-bold text-gray-900">₹{amountDue}</span>
                                                </div>
                                            )}
                                            {extraCharity > 0 && (
                                                <div className="flex justify-between items-center mb-2 text-green-600">
                                                    <span className="text-sm font-medium">Extra Donation (Sadaqah)</span>
                                                    <span className="font-bold">+₹{extraCharity}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                                                <span className="font-bold text-gray-900">Total to Pay</span>
                                                <span className="text-2xl font-black text-blue-600">₹{totalAmount}</span>
                                            </div>
                                        </Card>

                                        <div className="space-y-3">
                                            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">
                                                Add Extra Donation
                                            </label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[100, 500, 1000, 2000].map(amt => (
                                                    <Button
                                                        key={amt}
                                                        variant={extraCharity === amt ? "default" : "outline"}
                                                        size="sm"
                                                        className={`h-10 rounded-xl font-bold border-gray-200 ${extraCharity === amt ? 'bg-green-600 hover:bg-green-700 border-0' : 'text-gray-600 hover:bg-gray-50'}`}
                                                        onClick={() => setExtraCharity(amt)}
                                                    >
                                                        ₹{amt}
                                                    </Button>
                                                ))}
                                            </div>
                                            <div className="relative mt-2">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="Enter custom amount"
                                                    className="w-full pl-7 pr-3 py-2 text-sm border-gray-200 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-10 font-bold"
                                                    onChange={(e) => setExtraCharity(parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                                            <input
                                                type="checkbox"
                                                id="need80g"
                                                className="h-5 w-5 text-blue-600 rounded-lg border-gray-300 focus:ring-0"
                                                checked={need80G}
                                                onChange={(e) => setNeed80G(e.target.checked)}
                                            />
                                            <label htmlFor="need80g" className="text-sm font-bold text-gray-600 cursor-pointer">
                                                I need 80G Tax Exemption
                                            </label>
                                        </div>

                                        {need80G && (
                                            <div className="animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-[12px] font-bold text-gray-400 uppercase mb-1 block">PAN Number</label>
                                                <input
                                                    type="text"
                                                    value={donorPan}
                                                    onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                                                    placeholder="ABCDE1234F"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                    maxLength={10}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
                                            onClick={handlePayment}
                                            disabled={isPaymentLoading || totalAmount <= 0}
                                        >
                                            {isPaymentLoading ? (
                                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                            ) : (
                                                <>Pay ₹{totalAmount}</>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}

                {/* 2. Digital ID Card */}
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-900 text-white border-0 shadow-xl relative overflow-hidden h-[200px] rounded-[24px]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                    <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xl font-black tracking-tight leading-none text-white shadow-sm">
                                    {household.head_name || headName}
                                </p>
                                <p className="text-[12px] text-blue-100/80 font-medium tracking-wide drop-shadow-sm">
                                    {household?.address}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-100">Status</p>
                                <p className="text-[11px] font-black text-white flex items-center gap-1">
                                    <div className={`h-1.5 w-1.5 rounded-full ${membership?.is_active ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                                    {membership?.is_active ? 'ACTIVE' : 'EXPIRED'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4">
                            <div>
                                <p className="text-[10px] text-blue-200 uppercase font-black tracking-[0.2em]">Member ID</p>
                                <p className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                                    {household?.membership_id || `#${household?.id}`}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center text-[12px] font-bold px-2 py-1 bg-white/10 rounded-full border border-white/10">
                                    <Users className="h-3 w-3 mr-1.5 opacity-80" />
                                    {household?.member_count} Members
                                </div>
                                {membership?.end_date && (
                                    <p className="text-[9px] text-blue-200/60 font-medium uppercase tracking-tighter">
                                        Valid thru {new Date(membership.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Services Section (Native Grid) */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <h2 className="text-[12px] font-black text-gray-400 mb-3 uppercase tracking-[0.15em] px-1">Services</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link to="/portal/receipts" className="active:scale-95 transition-transform duration-200">
                            <Card className="hover:bg-blue-50/50 transition-colors border-0 shadow-sm bg-white rounded-2xl h-[100px] flex items-center justify-center">
                                <CardContent className="p-0 flex flex-col items-center">
                                    <div className="p-2.5 bg-green-50 rounded-xl mb-2">
                                        <Receipt className="h-6 w-6 text-green-600" />
                                    </div>
                                    <p className="font-bold text-sm text-gray-800">Receipt Vault</p>
                                    <p className="text-[10px] text-gray-400 font-medium">History</p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link to="/portal/announcements" className="active:scale-95 transition-transform duration-200">
                            <Card className="hover:bg-blue-50/50 transition-colors border-0 shadow-sm bg-white rounded-2xl h-[100px] flex items-center justify-center">
                                <CardContent className="p-0 flex flex-col items-center">
                                    <div className="p-2.5 bg-blue-50 rounded-xl mb-2">
                                        <Bell className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <p className="font-bold text-sm text-gray-800">Announcements</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Updates</p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link to="/portal/services" className="active:scale-95 transition-transform duration-200">
                            <Card className="hover:bg-blue-50/50 transition-colors border-0 shadow-sm bg-white rounded-2xl h-[100px] flex items-center justify-center">
                                <CardContent className="p-0 flex flex-col items-center">
                                    <div className="p-2.5 bg-purple-50 rounded-xl mb-2">
                                        <FileText className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <p className="font-bold text-sm text-gray-800">Service Desk</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Documents</p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link to="/portal/family" className="active:scale-95 transition-transform duration-200">
                            <Card className="hover:bg-blue-50/50 transition-colors border-0 shadow-sm bg-white rounded-2xl h-[100px] flex items-center justify-center">
                                <CardContent className="p-0 flex flex-col items-center">
                                    <div className="p-2.5 bg-orange-50 rounded-xl mb-2">
                                        <Users className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <p className="font-bold text-sm text-gray-800">Family Profile</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Manage</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>

                {/* Extra Padding for scrolling */}
                <div className="h-12" />
            </main>

            {/* Footer */}
            <footer className="w-full max-w-[420px] mx-auto border-t border-gray-100 py-10 mt-auto px-6 text-center bg-gray-50/30">
                <div className="flex flex-col items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-6 w-6 grayscale opacity-30" />
                    <p className="text-sm font-black text-gray-400 tracking-tight">Digital Jamath</p>
                </div>
                <div className="flex justify-center gap-4 mt-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                    <span>•</span>
                    <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                    <span>•</span>
                    <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
                </div>
                <p className="text-[9px] text-gray-300 mt-8 font-black uppercase tracking-[0.3em] border border-gray-200/50 rounded-full py-1 px-4 inline-block">
                    v2.0.0 Alpha
                </p>
            </footer>
        </div>
    );
}

export default PortalDashboardPage;
