"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ArrowLeft, FileText, Plus, Loader2 } from "lucide-react";

type ServiceRequest = {
    id: number;
    request_type: string;
    request_type_display: string;
    description: string;
    status: string;
    status_display: string;
    created_at: string;
    admin_notes?: string;
};

const REQUEST_TYPES = [
    { value: "NIKAAH_NAMA", label: "Nikaah Nama" },
    { value: "DEATH_CERT", label: "Death Certificate" },
    { value: "NOC", label: "Mahal Transfer NOC" },
    { value: "CHARACTER_CERT", label: "Character Certificate" },
    { value: "OTHER", label: "Other" },
];

export default function PortalServicesPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [requestType, setRequestType] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/portal/login");
            return;
        }
        fetchRequests(token);
    }, [router]);

    const fetchRequests = async (token: string) => {
        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/portal/service-requests/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem("access_token");
        if (!token || !requestType) return;

        setIsSubmitting(true);
        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/portal/service-requests/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    request_type: requestType,
                    description
                })
            });

            if (res.ok) {
                const newRequest = await res.json();
                setRequests([newRequest, ...requests]);
                setShowForm(false);
                setRequestType("");
                setDescription("");
            }
        } catch (err) {
            console.error("Failed to submit request", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800";
            case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
            case "APPROVED": return "bg-green-100 text-green-800";
            case "REJECTED": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <h1 className="font-bold text-lg ml-4">Service Desk</h1>
                    </div>
                    {!showForm && (
                        <Button size="sm" onClick={() => setShowForm(true)}>
                            <Plus className="h-4 w-4 mr-2" /> New Request
                        </Button>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {/* New Request Form */}
                {showForm && (
                    <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Submit New Request</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Document Type</label>
                                <Select value={requestType} onValueChange={setRequestType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select document type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REQUEST_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Additional Details</label>
                                <Textarea
                                    placeholder="Provide any additional information..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSubmit} disabled={!requestType || isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                                </Button>
                                <Button variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Request List */}
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading requests...</div>
                ) : requests.length === 0 && !showForm ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No service requests yet.</p>
                            <Button className="mt-4" onClick={() => setShowForm(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Submit a Request
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <Card key={req.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base">
                                            {req.request_type_display}
                                        </CardTitle>
                                        <Badge className={getStatusColor(req.status)}>
                                            {req.status_display}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {req.description && (
                                        <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                        Submitted: {new Date(req.created_at).toLocaleDateString('en-IN')}
                                    </p>
                                    {req.admin_notes && (
                                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                            <strong>Admin Notes:</strong> {req.admin_notes}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
