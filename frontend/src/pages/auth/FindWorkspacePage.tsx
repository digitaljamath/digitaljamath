import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getApiBaseUrl } from "@/lib/config";


export function FindWorkspacePage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setIsLoading(true);

        try {
            // Force absolute URL to ensure we hit the API and not Frontend (Nginx routing)
            const apiBase = "https://digitaljamath.com";
            console.log("Fetching API:", `${apiBase}/api/find-workspace/`);

            const res = await fetch(`${apiBase}/api/find-workspace/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email
                }),
            });

            if (res.ok) {
                setIsSuccess(true);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to find request. Please try again.");
            }
        } catch (err) {
            console.error("Search failed", err);
            setError("Network error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold mb-2 text-gray-900">Find Your Masjid</h1>
                            <p className="text-gray-500">
                                Enter your admin email to receive your Masjid workspace login URL.
                            </p>
                        </div>

                        {isSuccess ? (
                            <div className="text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
                                <p className="text-gray-600 mb-6">
                                    If an account exists with <strong>{email}</strong>, we've sent the login details to your inbox.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setEmail("");
                                    }}
                                    className="w-full"
                                >
                                    Try Another Email
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Admin Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@masjid.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11"
                                        required
                                    />
                                </div>


                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        "Find Masjid"
                                    )}
                                </Button>

                                <div className="text-center text-sm text-gray-500 mt-4">
                                    Don't have a workspace?{" "}
                                    <a href="/register" className="text-blue-600 hover:underline font-medium">
                                        Register New Masjid
                                    </a>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
