import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/config";

export function PortalLoginPage() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [masjidName, setMasjidName] = useState("DigitalJamath");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const fetchTenantInfo = async () => {
            try {
                const apiBase = getApiBaseUrl();
                const res = await fetch(`${apiBase}/api/tenant-info/`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.name && !data.is_public) {
                        setMasjidName(data.name);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tenant info", err);
            }
        };
        fetchTenantInfo();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!identifier || !password) {
            setError("Please enter both ID/Phone and Password");
            setIsLoading(false);
            return;
        }

        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/portal/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                return;
            }

            localStorage.setItem("portal_access_token", data.access);
            localStorage.setItem("portal_refresh_token", data.refresh);
            localStorage.setItem("portal_household_id", data.household_id);
            localStorage.setItem("portal_membership_id", data.membership_id);
            localStorage.setItem("portal_head_name", data.head_name);

            navigate("/portal/dashboard");
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                        <span className="font-bold text-xl text-gray-900">{masjidName}</span>
                    </Link>
                    <Link to="/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
                        Staff Login →
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <img src="/logo.png" alt="Logo" className="h-16 w-16 mx-auto" />
                        </div>
                        <CardTitle className="text-2xl">Member Login</CardTitle>
                        <CardDescription>
                            Enter your Mobile Number or Member ID
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mobile Number or Member ID</label>
                                <Input
                                    type="text"
                                    placeholder="e.g. 9876543210 or JM-001"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Password</label>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="text-lg pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <p className="text-gray-500">Default password is 123456</p>
                                    <button
                                        type="button"
                                        className="text-blue-600 hover:underline"
                                        onClick={() => alert("Please contact your Jamath admin to reset your password.")}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                                disabled={isLoading || !identifier || !password}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>Login <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                    <p>Powered by <a href="https://digitaljamath.com" className="text-blue-600 hover:underline">DigitalJamath</a></p>
                </div>
            </footer>
        </div>
    );
}
