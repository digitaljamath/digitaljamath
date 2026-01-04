import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/config";

export function PortalLoginPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<"phone" | "otp" | "telegram_required">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [masjidName, setMasjidName] = useState("DigitalJamath");
    const [isDemo, setIsDemo] = useState(false);
    const [telegramLinkUrl, setTelegramLinkUrl] = useState("");
    const [botUsername, setBotUsername] = useState("DigitalJamathBot");
    const [resendCountdown, setResendCountdown] = useState(0);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    useEffect(() => {
        const hostname = window.location.hostname;
        setIsDemo(hostname.startsWith('demo.'));

        const fetchTenantInfo = async () => {
            try {
                const apiBase = getApiBaseUrl();
                const res = await fetch(`${apiBase}/api/tenant-info/`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.name && !data.is_public) {
                        setMasjidName(data.name);
                    }
                    if (data.telegram_bot_username) {
                        setBotUsername(data.telegram_bot_username);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tenant info", err);
            }
        };
        fetchTenantInfo();
    }, []);

    const handleRequestOTP = async (isResend = false) => {
        setIsLoading(true);
        setError("");
        setSuccessMsg("");

        // Validate phone number (10 digits for India)
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            setError("Please enter a valid 10-digit mobile number");
            setIsLoading(false);
            return;
        }

        const fullPhone = `+91${cleanPhone}`;

        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/portal/request-otp/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: fullPhone })
            });

            const data = await res.json();

            if (!res.ok) {
                // Check if Telegram linking is required
                if (data.error?.includes("Telegram not linked")) {
                    setTelegramLinkUrl(`https://t.me/${botUsername}?start=link_91${cleanPhone}`);
                    setStep("telegram_required");
                    return;
                }
                setError(data.error || "Failed to send OTP");
                return;
            }

            // Update demo status from backend response
            if (data.demo !== undefined) {
                setIsDemo(data.demo);
            }

            setStep("otp");
            if (isResend) {
                setSuccessMsg("OTP sent via Telegram");
                setResendCountdown(30);
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setIsLoading(true);
        setError("");

        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = `+91${cleanPhone}`;

        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/portal/verify-otp/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: fullPhone, otp })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Invalid OTP");
                return;
            }

            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            localStorage.setItem("household_id", data.household_id);
            localStorage.setItem("membership_id", data.membership_id);
            localStorage.setItem("head_name", data.head_name);

            navigate("/portal/dashboard");
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                        <span className="font-bold text-xl text-gray-900">{masjidName}</span>
                    </Link>
                    <Link to="/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
                        Staff Login →
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <img src="/logo.png" alt="Logo" className="h-16 w-16 mx-auto" />
                        </div>
                        <CardTitle className="text-2xl">{masjidName}</CardTitle>
                        <CardDescription>
                            {step === "phone" && "Enter your registered mobile number"}
                            {step === "otp" && `Enter the OTP sent to +91 ****${phone.slice(-4)}`}
                            {step === "telegram_required" && "Link your Telegram to receive OTP"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {successMsg}
                            </div>
                        )}

                        {step === "phone" && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mobile Number</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                                            +91
                                        </span>
                                        <Input
                                            type="tel"
                                            placeholder="98765 43210"
                                            value={phone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setPhone(val);
                                            }}
                                            className="rounded-l-none text-lg"
                                            maxLength={12}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Indian mobile numbers only</p>
                                </div>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                    onClick={() => handleRequestOTP(false)}
                                    disabled={isLoading || phone.length < 10}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>Send OTP <ArrowRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                                {!isDemo && (
                                    <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                                        <MessageCircle className="h-3 w-3" />
                                        OTP will be sent via Telegram
                                    </p>
                                )}
                            </>
                        )}

                        {step === "otp" && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Enter OTP</label>
                                    <Input
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="text-lg text-center tracking-widest"
                                        maxLength={6}
                                    />
                                </div>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                    onClick={handleVerifyOTP}
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>Verify & Login</>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => { setStep("phone"); setOtp(""); }}
                                >
                                    Change Number
                                </Button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRequestOTP(true)}
                                        disabled={isLoading || resendCountdown > 0}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                                    >
                                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                                    </button>
                                </div>
                                {isDemo && (
                                    <p className="text-center text-xs text-blue-600 font-mono bg-blue-50 p-2 rounded">
                                        Demo OTP: 123456
                                    </p>
                                )}
                            </>
                        )}

                        {step === "telegram_required" && (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900 mb-2">First Time Setup</h3>
                                    <div className="text-sm text-gray-700 mb-4 text-left space-y-2 bg-white/50 p-3 rounded">
                                        <p>1. Click <b>Link Telegram</b> below</p>
                                        <p>2. Tap <b>Start</b> in the Telegram bot</p>
                                        <p>3. Copy the OTP sent by the bot</p>
                                    </div>
                                    <a
                                        href={telegramLinkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b3] transition-colors w-full justify-center font-medium"
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.13l-1.97 9.29c-.15.67-.54.83-1.1.52l-3.03-2.23-1.46 1.41c-.16.16-.3.3-.61.3l.22-3.08 5.6-5.06c.24-.22-.05-.34-.38-.13l-6.92 4.36-2.98-.93c-.65-.2-.66-.65.14-.96l11.65-4.49c.54-.2 1.01.13.84.96z" />
                                        </svg>
                                        Link Telegram
                                    </a>
                                </div>

                                <div className="pt-2">
                                    <p className="text-sm text-gray-500 mb-2">Received the code?</p>
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={() => { setStep("otp"); setError(""); }}
                                    >
                                        Enter OTP
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full text-gray-400 hover:text-gray-600"
                                    onClick={() => { setStep("phone"); setError(""); }}
                                >
                                    Change Number
                                </Button>
                            </div>
                        )}

                        {step !== "telegram_required" && (
                            <div className="text-center text-sm text-gray-500 pt-4 border-t">
                                <p>Staff? <Link to="/auth/signin" className="text-blue-600 hover:underline">Login with email</Link></p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    <p>Powered by <a href="/" className="text-blue-600 hover:underline">DigitalJamath</a></p>
                </div>
            </footer>
        </div>
    );
}
