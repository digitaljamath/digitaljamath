"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ArrowRight, Loader2 } from "lucide-react";

export default function PortalLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRequestOTP = async () => {
        setIsLoading(true);
        setError("");

        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/portal/request-otp/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phone })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to send OTP");
                return;
            }

            setStep("otp");
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setIsLoading(true);
        setError("");

        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/portal/verify-otp/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phone, otp })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Invalid OTP");
                return;
            }

            // Store tokens
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            localStorage.setItem("household_id", data.household_id);
            localStorage.setItem("membership_id", data.membership_id);
            localStorage.setItem("head_name", data.head_name);

            // Redirect to portal dashboard
            router.push("/portal/dashboard");
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl">Member Portal</CardTitle>
                    <CardDescription>
                        {step === "phone"
                            ? "Enter your registered mobile number to login"
                            : `Enter the OTP sent to ****${phone.slice(-4)}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {step === "phone" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <Input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="text-lg"
                                />
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleRequestOTP}
                                disabled={isLoading || !phone}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>Send OTP <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Enter OTP</label>
                                <Input
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="text-lg text-center tracking-widest"
                                    maxLength={6}
                                />
                            </div>
                            <Button
                                className="w-full"
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
                                onClick={() => setStep("phone")}
                            >
                                Change Number
                            </Button>
                        </>
                    )}

                    <p className="text-center text-xs text-gray-500 mt-4">
                        By logging in, you agree to our Terms of Service
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
