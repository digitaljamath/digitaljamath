import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getApiBaseUrl } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";

export function RegisterPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast({
                    title: "Registration successful!",
                    description: "Your mosque workspace has been created. Please log in.",
                });
                navigate('/auth/masjid/login');
            } else {
                const data = await res.json();
                toast({
                    variant: "destructive",
                    title: "Registration failed",
                    description: data.error || data.detail || "Please check your information and try again."
                });
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Network error",
                description: "Could not connect to the server. Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <SiteHeader />
            <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Create Workspace</h1>
                        <p className="text-slate-500 mt-2 text-sm">Register your Masjid to start managing digitally.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Masjid Name</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="name"
                                    placeholder="e.g. Test Masjid"
                                    className="pl-9"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    className="pl-9"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pb-2">
                            <Label htmlFor="password">Admin Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                            ) : (
                                <>
                                    Complete Registration <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/auth/masjid/login" className="text-emerald-600 font-medium hover:underline">
                            Login here
                        </Link>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
