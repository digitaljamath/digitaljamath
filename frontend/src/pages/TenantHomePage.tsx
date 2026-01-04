import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Loader2, Home } from "lucide-react";
import { getApiBaseUrl } from "@/lib/config";

export function TenantHomePage() {
    const [tenantName, setTenantName] = useState<string | null>(null);
    const [tenantError, setTenantError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkTenant = async () => {
            const hostname = window.location.hostname;
            const subdomain = hostname.split('.')[0];

            // If no subdomain, show error
            if (hostname === 'localhost' || hostname === 'digitaljamath.com' || subdomain === 'localhost' || subdomain === 'www') {
                setTenantError('Please access your masjid via its subdomain.');
                setLoading(false);
                return;
            }

            try {
                const apiBase = getApiBaseUrl();
                const res = await fetch(`${apiBase}/api/tenant-info/`);

                if (!res.ok) {
                    setTenantError('Masjid not found. Please check the URL.');
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                if (data.is_public) {
                    setTenantError('This is not a valid masjid subdomain.');
                    setLoading(false);
                    return;
                }

                setTenantName(data.name || subdomain);
                setLoading(false);
            } catch (err) {
                setTenantError('Unable to verify masjid.');
                setLoading(false);
            }
        };

        checkTenant();
    }, []);

    // Common Header Component
    const Header = () => (
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                    <span className="font-bold text-xl text-gray-900">{tenantName || 'DigitalJamath'}</span>
                </div>
            </div>
        </header>
    );

    // Common Footer Component
    const Footer = () => (
        <footer className="border-t bg-white/80 py-4 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                <p>Powered by <a href="/" className="text-blue-600 hover:underline">DigitalJamath</a></p>
            </div>
        </footer>
    );

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Helper to get root domain URL (strips subdomain)
    const getRootDomainUrl = () => {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        // Handle demo.digitaljamath.com -> digitaljamath.com
        // Handle demo.localhost -> localhost
        if (parts.length >= 2) {
            const rootDomain = parts.slice(1).join('.');
            const port = window.location.port ? `:${window.location.port}` : '';
            return `${window.location.protocol}//${rootDomain}${port}`;
        }
        return '/';
    };

    // Error state (404 / Invalid Subdomain)
    if (tenantError) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <main className="flex-1 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-xl border-red-100">
                        <CardHeader className="text-center pb-2">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                <Home className="h-8 w-8 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-gray-900">Masjid Not Found</CardTitle>
                            <CardDescription className="text-base mt-2">
                                We couldn't find a masjid at this address.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-6 pt-4">
                            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                {tenantError}
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
                                    <a href="/find-masjid">Find Your Masjid</a>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <a href={getRootDomainUrl()}>Go to Home Page</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    // Success State - Tenant Landing Page
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center mb-12 animate-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Welcome to {tenantName}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Access your dashboard or member portal below
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    {/* Staff Login Card */}
                    <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle>Staff Portal</CardTitle>
                            <CardDescription>
                                For committee members and administrators
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-11">
                                <Link to="/auth/signin">Login with Email</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Member Login Card */}
                    <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                <Phone className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle>Member Portal</CardTitle>
                            <CardDescription>
                                For Jamath members and households
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50 h-11">
                                <Link to="/portal/login">Login with OTP</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Demo Credentials - only show on demo subdomain */}
                {window.location.hostname.startsWith('demo.') && (
                    <div className="max-w-md mx-auto mt-12 p-4 bg-white/80 rounded-lg border text-center animate-in fade-in duration-1000 delay-300">
                        <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Demo Credentials</p>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded border">
                            <div>
                                <p className="font-semibold text-gray-700">Staff</p>
                                <p className="text-gray-500 font-mono text-xs mt-1">admin@demo.com<br />password</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">Member</p>
                                <p className="text-gray-500 font-mono text-xs mt-1">+919876543210<br />OTP: 123456</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
