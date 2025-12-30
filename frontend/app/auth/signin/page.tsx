"use client";
import { getApiBaseUrl, getBaseDomain } from '@/lib/config';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tenantName, setTenantName] = useState<string>("");

    // Get tenant name from subdomain and redirect if on main domain
    useEffect(() => {
        const hostname = window.location.hostname;
        const baseDomain = getBaseDomain();

        // Check if it's the main domain (no subdomain)
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === baseDomain) {
            // Redirect to workspace entry page
            router.replace('/auth/login');
            return;
        }

        // Extract subdomain as tenant name
        const subdomain = hostname.split('.')[0];
        setTenantName(subdomain);
    }, [router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/token/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: email, password: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error("Invalid email or password");
            }

            // Store Token
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);

            // Redirect to Dashboard
            router.push("/dashboard");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
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
                    {tenantName && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {tenantName}
                        </span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Welcome back
                        </CardTitle>
                        <CardDescription className="text-center">
                            Sign in to {tenantName || "your"} workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email / Username</Label>
                                <Input name="email" id="email" placeholder="admin" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input name="password" id="password" type="password" required />
                            </div>
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Signing In..." : "Sign In"}
                            </Button>
                            <div className="text-center text-sm text-gray-500 space-y-2">
                                <div>
                                    <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="pt-2 border-t">
                                    <Link
                                        href={`${typeof window !== 'undefined' ? window.location.protocol : 'https:'}//${getBaseDomain()}/auth/login`}
                                        className="text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        Not your workspace? Sign in to different workspace →
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white dark:bg-gray-950 py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} DigitalJamath. Open Source under MIT License.</p>
                    <p className="text-xs mt-1">Version 1.0.1-alpha</p>
                </div>
            </footer>
        </div>
    );
}
