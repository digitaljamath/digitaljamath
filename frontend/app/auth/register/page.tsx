"use client";
import { getApiBaseUrl } from "@/lib/config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
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
            // Determine API Base URL


            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/register/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const text = await response.text();
            console.log("Raw Response:", text); // Debugging

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error("Server returned non-JSON response: " + text.slice(0, 100));
            }

            if (!response.ok) {
                throw new Error(result.error || "Registration failed");
            }

            // Success: Redirect to success page or login
            // Ideally we show the user their new URL
            // For now, let's redirect to login for simplicity
            alert(`Masjid account created! Use ${result.tenant_url} to access.`);
            router.push("/auth/login"); // Or redirect to tenant URL? 

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Register your Masjid</CardTitle>
                    <CardDescription className="text-center">
                        Create a new Masjid workspace / account for your community.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="masjidName">Masjid Name</Label>
                            <Input name="masjidName" id="masjidName" placeholder="e.g. Jama Masjid Bangalore" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Workspace Domain</Label>
                            <div className="flex items-center space-x-2">
                                <Input name="domain" id="domain" placeholder="jama-blr" required />
                                <span className="text-gray-500 text-sm">.digitaljamath.com</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input name="email" id="email" type="email" placeholder="admin@masjid.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input name="password" id="password" type="password" required />
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
        </div>
    );
}
