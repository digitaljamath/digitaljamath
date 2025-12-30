"use client";
import { getDomainSuffix, getBaseDomain } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [workspace, setWorkspace] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If we're on a subdomain, redirect to /auth/signin directly
    useEffect(() => {
        const hostname = window.location.hostname;
        const baseDomain = getBaseDomain();

        // Check if we're on a subdomain (not main domain, not localhost)
        const isSubdomain = hostname !== 'localhost' &&
            hostname !== '127.0.0.1' &&
            hostname !== baseDomain &&
            hostname.includes('.');

        if (isSubdomain) {
            // Already on a subdomain, go directly to signin
            router.replace('/auth/signin');
        }
    }, [router]);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!workspace.trim()) {
            setError("Please enter your workspace name");
            return;
        }

        // Validate workspace format (alphanumeric and hyphens only)
        const workspaceRegex = /^[a-zA-Z0-9-]+$/;
        if (!workspaceRegex.test(workspace)) {
            setError("Workspace name can only contain letters, numbers, and hyphens");
            return;
        }

        setIsLoading(true);

        // Redirect to tenant login page
        const domainSuffix = getDomainSuffix();
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';

        // For localhost, use port 3000
        let redirectUrl: string;
        if (domainSuffix === 'localhost') {
            redirectUrl = `${protocol}//${workspace}.localhost:3000/auth/signin`;
        } else {
            redirectUrl = `${protocol}//${workspace}.${domainSuffix}/auth/signin`;
        }

        window.location.href = redirectUrl;
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
                        <CardTitle className="text-2xl font-bold text-center">Sign in to your Masjid</CardTitle>
                        <CardDescription className="text-center">
                            Enter your Masjid workspace to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="workspace">Masjid Workspace</Label>
                                <div className="flex items-center">
                                    <Input
                                        id="workspace"
                                        placeholder="jama-blr"
                                        value={workspace}
                                        onChange={(e) => setWorkspace(e.target.value.toLowerCase())}
                                        className="rounded-r-none"
                                        required
                                    />
                                    <span className="inline-flex items-center px-3 h-10 border border-l-0 border-gray-300 bg-gray-100 text-gray-500 text-sm rounded-r-md whitespace-nowrap">
                                        .{getDomainSuffix()}
                                    </span>
                                </div>
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Redirecting..." : "Continue"}
                            </Button>

                            <div className="text-center space-y-3 pt-4">
                                <Link
                                    href="/auth/find-workspace"
                                    className="text-sm text-blue-600 hover:underline block"
                                >
                                    Forgot your workspace?
                                </Link>
                                <div className="text-sm text-gray-500">
                                    Don't have an account?{" "}
                                    <Link href="/auth/register" className="text-blue-600 hover:underline">
                                        Register your Masjid
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
                    <p className="text-xs mt-1">Version 1.0.2-alpha</p>
                </div>
            </footer>
        </div>
    );
}
