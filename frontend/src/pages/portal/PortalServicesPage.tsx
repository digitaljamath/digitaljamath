import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, FileText, Plus, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ServiceRequest {
    id: number;
    request_type: string;
    description: string;
    status: string;
    created_at: string;
    admin_notes?: string;
}

const REQUEST_TYPES = [
    { value: 'NIKAAH_NAMA', label: 'Nikaah Nama' },
    { value: 'DEATH_CERT', label: 'Death Certificate' },
    { value: 'NOC', label: 'Mahal Transfer NOC' },
    { value: 'CHARACTER_CERT', label: 'Character Certificate' },
    { value: 'OTHER', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'APPROVED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
};

export function PortalServicesPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        request_type: '',
        description: ''
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/portal/service-requests/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            } else if (res.status === 401) {
                navigate('/portal/login');
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.request_type) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/portal/service-requests/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setFormData({ request_type: '', description: '' });
                fetchRequests();
            }
        } catch (err) {
            console.error("Failed to submit request", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="h-4 w-4" />;
            case 'IN_PROGRESS': return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
            case 'REJECTED': return <XCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/portal">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
                            <p className="text-sm text-gray-500">Request documents and certificates</p>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Service Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Request Type</Label>
                                    <Select
                                        value={formData.request_type}
                                        onValueChange={(val) => setFormData({ ...formData, request_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type..." />
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
                                    <Label>Description (Optional)</Label>
                                    <Textarea
                                        placeholder="Any additional details..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting || !formData.request_type}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">No Requests</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Submit a request for documents or certificates.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <Card key={request.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">
                                            {REQUEST_TYPES.find(t => t.value === request.request_type)?.label || request.request_type}
                                        </CardTitle>
                                        <Badge className={STATUS_COLORS[request.status] || 'bg-gray-100'}>
                                            {getStatusIcon(request.status)}
                                            <span className="ml-1">{request.status.replace('_', ' ')}</span>
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Submitted: {format(new Date(request.created_at), 'dd MMM yyyy')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {request.description && (
                                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                                    )}
                                    {request.admin_notes && (
                                        <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                                            <strong>Note:</strong> {request.admin_notes}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
