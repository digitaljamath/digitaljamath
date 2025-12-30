"use client";
import { getApiBaseUrl } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        async function verify() {
            try {
                // Determine API Base URL for main domain (Assuming verification runs on main domain or any)
                // Actually verification token is global for the Client.


                const apiBase = getApiBaseUrl();

                const response = await fetch(`${apiBase}/api/verify-email/?token=${token}`);

                if (response.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                }
            } catch (e) {
                setStatus("error");
            }
        }
        verify();
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    {status === "loading" && (
                        <div className="text-center">Verifying your email...</div>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <p className="text-center text-green-700 font-medium">Your workspace has been verified!</p>
                            <Button className="w-full" asChild>
                                <Link href="/auth/signin">Login to Dashboard</Link>
                            </Button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="h-16 w-16 text-red-500" />
                            <p className="text-center text-red-700 font-medium">Invalid or expired verification link.</p>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/">Return Home</Link>
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}
