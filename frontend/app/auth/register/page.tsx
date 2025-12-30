"use client";
import { getApiBaseUrl, getDomainSuffix, getBaseDomain } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [domainSuffix, setDomainSuffix] = useState<string>("localhost");

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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!agreedToTerms) {
            setError("Please agree to the Terms and Conditions to continue.");
            return;
        }

        setIsLoading(true);
        setError(null);

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
            console.log("Raw Response:", text);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
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

            // Success: Redirect to success page or login
            alert(`Masjid account created! Use ${result.tenant_url} to access.`);
            router.push("/auth/login");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
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
                                {isLoading ? "Creating..." : "Create Masjid Account"}
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
                    <p className="text-xs mt-1">Version 1.0.3-alpha</p>
                </div>
            </footer>
        </div>
    );
}
