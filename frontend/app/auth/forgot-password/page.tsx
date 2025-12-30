"use client";
import { getApiBaseUrl } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Determine API Base URL


            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/auth/password-reset-request/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                // We typically don't show errors for security, but for now:
                // const data = await response.json();
                // throw new Error(data.error);
                // Actually good practice is to always say "If account exists..."
            }

            setMessage("If an account exists with this email, you will receive a password reset link.");

        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to receive a reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!message ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@masjid.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className="bg-green-50 p-4 rounded text-green-700 text-sm">
                                {message}
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/auth/signin">Back to Login</Link>
                            </Button>
                        </div>
                    )}

                    {!message && (
                        <div className="mt-6 text-center text-sm text-gray-500">
                            <Link href="/auth/signin" className="text-blue-600 hover:underline">
                                Back to Sign In
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
