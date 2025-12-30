"use client";
import { getApiBaseUrl } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ExternalLink } from "lucide-react";

type Workspace = {
    name: string;
    url: string;
    login_url: string;
};

export default function FindWorkspacePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setWorkspaces(null);
        setSearched(false);

        try {
            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/find-workspace/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error("Failed to search");
            }

            const data = await response.json();
            setWorkspaces(data.workspaces);
            setSearched(true);
        } catch (err) {
            setError("Something went wrong. Please try again.");
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
                    <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to Sign In
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Find Your Masjid</CardTitle>
                        <CardDescription className="text-center">
                            Enter your admin email to find your Masjid workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!searched ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Admin Email</Label>
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
                                    {isLoading ? "Searching..." : "Find My Masjid"}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                {workspaces && workspaces.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-green-600 font-medium text-center">
                                            Found {workspaces.length} Masjid workspace{workspaces.length > 1 ? 's' : ''}:
                                        </p>
                                        <div className="grid gap-2">
                                            {workspaces.map((ws) => (
                                                <a
                                                    key={ws.url}
                                                    href={ws.login_url.replace('/auth/login', '/auth/signin')}
                                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div>
                                                        <span className="font-medium">{ws.name}</span>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {ws.url.replace('http://', '').replace('https://', '').replace(':3000/', '')}
                                                        </p>
                                                    </div>
                                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <p className="text-sm text-gray-500">No Masjid workspaces found for this email.</p>
                                        <p className="text-xs text-gray-400">
                                            Make sure you're using the email you registered with.
                                        </p>
                                    </div>
                                )}

                                <Button variant="outline" onClick={() => setSearched(false)} className="w-full">
                                    {workspaces && workspaces.length > 0 ? "Search Again" : "Try Another Email"}
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500 space-y-2">
                            <Link href="/auth/login" className="text-blue-600 hover:underline block">
                                Back to Sign In
                            </Link>
                            <div className="text-gray-400">
                                Don't have an account?{" "}
                                <Link href="/auth/register" className="text-blue-600 hover:underline">
                                    Register your Masjid
                                </Link>
                            </div>
                        </div>
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
