"use client";
import { getApiBaseUrl } from '@/lib/config';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if on main domain (no subdomain) - protect public schema
    useEffect(() => {
        const hostname = window.location.hostname;
        // Check if it's the main domain (localhost without subdomain, or main production domain)
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'digitaljamath.com') {
            // Redirect to landing page
            router.replace('/');
        }
    }, [router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            // Determine API Base URL
            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/token/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: email, password: password }), // DRF expects 'username', but we mostly use email
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error("Invalid credentials");
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
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <div className="absolute top-4 left-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                    ← Back to Home
                </Button>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Sign in to DigitalJamath</CardTitle>
                    <CardDescription className="text-center">
                        Access your Masjid Dashboard
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
                            <div>
                                Don't have an account?{" "}
                                <Link href="/auth/register" className="text-blue-600 hover:underline">
                                    Register your Masjid
                                </Link>
                            </div>
                            <div>
                                <Link href="/auth/find-workspace" className="text-gray-400 hover:text-gray-600 hover:underline text-xs">
                                    Forgot your workspace URL?
                                </Link>
                            </div>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
