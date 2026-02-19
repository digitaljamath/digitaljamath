
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Save, CheckCircle, BrainCircuit, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithAuth } from "@/lib/api";

export function SystemSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [openrouterKey, setOpenrouterKey] = useState("");
    const [brevoKey, setBrevoKey] = useState("");
    const [brevoSender, setBrevoSender] = useState("");
    const [enableRegistration, setEnableRegistration] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetchWithAuth('/api/system-config/');
            if (res.ok) {
                const data = await res.json();
                // Keys are write-only, so they return empty or null usually
                // We leave them blank to indicate "unchanged" unless user types
                setBrevoSender(data.brevo_email_sender || "");
                setEnableRegistration(data.enable_registration ?? true);
                setMaintenanceMode(data.maintenance_mode ?? false);
            } else {
                toast({ title: "Error", description: "Failed to load system settings", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: any = {
                enable_registration: enableRegistration,
                maintenance_mode: maintenanceMode,
                brevo_email_sender: brevoSender
            };

            // Only send keys if they are typed
            if (openrouterKey) payload.openrouter_api_key = openrouterKey;
            if (brevoKey) payload.brevo_api_key = brevoKey;

            const res = await fetchWithAuth('/api/system-config/', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast({ title: "Success", description: "System settings updated." });
                setOpenrouterKey(""); // Clear fields for security
                setBrevoKey("");
            } else {
                toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Network error.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/dashboard/settings"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Configuration</h1>
                    <p className="text-muted-foreground">Manage global API keys and system-wide settings.</p>
                </div>
            </div>

            {/* AI Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-purple-600" /> Basira AI Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure the LLM provider for AI features.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>OpenRouter API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                placeholder="sk-or-v1-..."
                                value={openrouterKey}
                                onChange={e => setOpenrouterKey(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Leave blank to keep existing key. Used for Audit Guard and Chat features.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-600" /> Email Service (Brevo)
                    </CardTitle>
                    <CardDescription>
                        SMTP configuration for automated emails.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Brevo API Key</Label>
                            <Input
                                type="password"
                                placeholder="xkeysib-..."
                                value={brevoKey}
                                onChange={e => setBrevoKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Leave blank to keep existing.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Sender Email Address</Label>
                            <Input
                                placeholder="noreply@jamath.com"
                                value={brevoSender}
                                onChange={e => setBrevoSender(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Flags */}
            <Card>
                <CardHeader>
                    <CardTitle>System Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable New Registrations</Label>
                            <p className="text-sm text-muted-foreground">Allow new tenants to sign up.</p>
                        </div>
                        <Switch checked={enableRegistration} onCheckedChange={setEnableRegistration} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">Block non-admin access.</p>
                        </div>
                        <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save System Settings
                </Button>
            </div>
        </div>
    );
}
