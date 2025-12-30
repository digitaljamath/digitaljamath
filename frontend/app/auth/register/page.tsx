"use client";
import { getApiBaseUrl, getDomainSuffix, getBaseDomain, APP_VERSION } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Creative loading messages (Technical but themed)
const loadingMessages = [
    "Provisioning your secure cloud workspace...",
    "Initializing encrypted database shards...",
    "Configuring member registry modules...",
    "Setting up private daily backup systems...",
    "Deploying audit trail logs...",
    "Generating admin access credentials...",
    "Finalizing your dedicated digital space...",
];

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [domainSuffix, setDomainSuffix] = useState<string>("localhost");
    const [messageIndex, setMessageIndex] = useState(0);
    const [successParams, setSuccessParams] = useState<{ email: string, workspaceUrl: string, estimatedTime: string } | null>(null);

    // Registration is only for main domain - redirect subdomain visitors to signin
    useEffect(() => {
        const hostname = window.location.hostname;
        const baseDomain = getBaseDomain();

        // Set domain suffix for display (avoid hydration mismatch)
        setDomainSuffix(getDomainSuffix());

        // Check for local dev subdomain (e.g., demo.localhost)
        const isLocalSubdomain = hostname.endsWith('.localhost');

        // Check for production subdomain
        const isProductionSubdomain = hostname !== baseDomain &&
            hostname.includes('.') &&
            hostname !== 'localhost' &&
            hostname !== '127.0.0.1';

        if (isLocalSubdomain || isProductionSubdomain) {
            // On subdomain, redirect to signin (staff users don't register)
            router.replace('/auth/signin');
        }
    }, [router]);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
            }, 3000); // Change message every 3 seconds
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!agreedToTerms) {
            setError("Please agree to the Terms and Conditions to continue.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setMessageIndex(0);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("masjidName"),
            domain: formData.get("domain"),
            email: formData.get("email"),
            password: formData.get("password"),
        };

        try {
            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/register/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const text = await response.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // If it's not JSON, it might be a server 500 html page
                throw new Error("Server error. Please try again later.");
            }

            if (!response.ok) {
                // Make error messages more user-friendly
                let errorMsg = result.error || "Registration failed";
                if (errorMsg.includes("Schema")) {
                    errorMsg = "This Masjid workspace name is already taken. Please choose a different name.";
                }
                throw new Error(errorMsg);
            }

            // Handle 202 Accepted (Async creation)
            if (response.status === 202) {
                setSuccessParams({
                    email: data.email as string,
                    workspaceUrl: result.tenant_url,
                    estimatedTime: result.estimated_time
                });
            } else {
                // Fallback for sync creation (shouldn't happen with new backend but good for safety)
                alert(`Masjid account created! Use ${result.tenant_url} to access.`);
                router.push("/auth/login");
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsLoading(false);
        }
    }

    // If successfully submitted (Async pending)
    if (successParams) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <CardTitle className="text-2xl font-bold">Registration Accepted!</CardTitle>
                        <CardDescription>
                            Your workspace is being created in the background.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                            <p className="font-semibold mb-1">Estimated Setup Time: {successParams.estimatedTime}</p>
                            <p>We are provisioning your secluded database and specialized modules.</p>
                        </div>
                        <div className="text-gray-600">
                            <p>You can close this window.</p>
                            <p className="mt-2">We will send an email to <strong>{successParams.email}</strong> when <strong>{successParams.workspaceUrl}</strong> is ready.</p>
                        </div>
                        <Button className="w-full mt-4" onClick={() => router.push('/')} variant="outline">
                            Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // If Loading (during submission) - Show Creative Messages
    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-10">
                    <CardContent className="space-y-6">
                        {/* Spinner */}
                        <div className="relative mx-auto w-16 h-16">
                            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>

                        <div className="space-y-2 animate-pulse">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Setting up your DigitalJamath...
                            </h3>
                            <p className="text-blue-600 font-medium h-6 transition-all duration-500 ease-in-out">
                                {loadingMessages[messageIndex]}
                            </p>
                        </div>

                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            This typically takes about 2-3 minutes as we set up your secure, isolated database schema.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
                <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
                    <Link className="flex items-center justify-center font-bold text-xl gap-2" href="/">
                        <Image src="/logo.png" alt="DigitalJamath Logo" width={32} height={32} className="h-8 w-8" />
                        DigitalJamath
                    </Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Register your Masjid</CardTitle>
                        <CardDescription className="text-center">
                            Create a new Masjid workspace for your community.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="masjidName">Masjid Name</Label>
                                <Input name="masjidName" id="masjidName" placeholder="e.g. Jama Masjid Bangalore" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="domain">Workspace URL</Label>
                                <div className="flex items-center space-x-2">
                                    <Input name="domain" id="domain" placeholder="jama-blr" required />
                                    <span className="text-gray-500 text-sm whitespace-nowrap">.{domainSuffix}</span>
                                </div>
                                <p className="text-xs text-gray-400">This will be your unique Masjid URL</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Admin Email</Label>
                                <Input name="email" id="email" type="email" placeholder="admin@masjid.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input name="password" id="password" type="password" required />
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={agreedToTerms}
                                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                                    {" "}and{" "}
                                    <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                                </label>
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                Create Masjid Account
                            </Button>
                            <div className="text-center text-sm text-gray-500">
                                Already registered?{" "}
                                <Link href="/auth/login" className="text-blue-600 hover:underline">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white dark:bg-gray-950 py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} DigitalJamath. Open Source under MIT License.</p>
                    <p className="text-xs mt-1">Version {APP_VERSION}</p>
                </div>
            </footer>
        </div>
    );
}
