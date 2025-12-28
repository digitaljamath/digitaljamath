"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
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
            // Determine API Base URL
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`; // Direct to Backend

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
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Find Your Workspace</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to find your Masjid's login URL.
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
                                {isLoading ? "Searching..." : "Find Workspace"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {workspaces && workspaces.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-green-600 font-medium text-center">Found {workspaces.length} workspace(s):</p>
                                    <div className="grid gap-2">
                                        {workspaces.map((ws) => (
                                            <a
                                                key={ws.url}
                                                href={ws.login_url}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-medium">{ws.name}</span>
                                                <ExternalLink className="h-4 w-4 text-gray-400" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-gray-500">No workspaces found for this email.</p>
                                    <Button variant="outline" onClick={() => setSearched(false)} className="w-full">
                                        Try another email
                                    </Button>
                                </div>
                            )}

                            {workspaces && workspaces.length > 0 && (
                                <Button variant="outline" onClick={() => setSearched(false)} className="w-full mt-4">
                                    Search Again
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <Link href="/auth/login" className="text-blue-600 hover:underline">
                            Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
