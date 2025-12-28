"use client";

import { useEffect, useState } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface ServiceRequest {
    id: number;
    request_type: string;
    request_type_display: string;
    description: string;
    status: string;
    status_display: string;
    admin_notes: string;
    created_at: string;
    requester_name?: string;
    household_id?: string;
}

export default function AdminInboxPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const { toast } = useToast();

    const fetchRequests = async (statusFilter?: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            let url = `${apiBase}/api/jamath/service-requests/`;
            if (statusFilter) {
                url += `?status=${statusFilter}`;
            }
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests('PENDING'); // Default tab
    }, []);

    const handleAction = async (newStatus: string) => {
        if (!selectedRequest) return;

        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/jamath/service-requests/${selectedRequest.id}/update_status/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: newStatus,
                    admin_notes: adminNotes,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Status Updated",
                    description: `Request marked as ${newStatus}`,
                });
                setIsDialogOpen(false);
                fetchRequests('PENDING'); // Refresh default view or current view
            } else {
                toast({
                    title: "Error",
                    description: "Failed to update status",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case "IN_PROGRESS":
                return <Badge variant="outline" className="text-blue-600 border-blue-600"><AlertCircle className="w-3 h-3 mr-1" /> In Progress</Badge>;
            case "APPROVED":
                return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case "REJECTED":
                return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Service Desk Inbox</h2>
                <p className="text-muted-foreground">Manage and track member service requests.</p>
            </div>

            <Tabs defaultValue="PENDING" onValueChange={(val) => fetchRequests(val === 'ALL' ? undefined : val)}>
                <TabsList>
                    <TabsTrigger value="PENDING">Pending</TabsTrigger>
                    <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
                    <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                    <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                    <TabsTrigger value="ALL">All Requests</TabsTrigger>
                </TabsList>

                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p>Loading requests...</p>
                    ) : requests.length === 0 ? (
                        <p className="text-muted-foreground col-span-full text-center py-8">No requests found in this category.</p>
                    ) : (
                        requests.map((req) => (
                            <Card key={req.id} className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => {
                                setSelectedRequest(req);
                                setAdminNotes(req.admin_notes || "");
                                setIsDialogOpen(true);
                            }}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-medium">{req.request_type_display}</CardTitle>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <CardDescription>
                                        {format(new Date(req.created_at), "MMM d, yyyy")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {req.description || "No description provided."}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </Tabs>

            {/* Action Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review Request</DialogTitle>
                        <DialogDescription>
                            Review the details and take action.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="font-semibold">Requested By:</span>
                                <span className="font-medium text-blue-600">{selectedRequest.requester_name || 'Unknown'}</span>
                                <span className="font-semibold">Household ID:</span>
                                <span>{selectedRequest.household_id || 'N/A'}</span>
                                <span className="font-semibold">Type:</span>
                                <span>{selectedRequest.request_type_display}</span>
                                <span className="font-semibold">Date:</span>
                                <span>{format(new Date(selectedRequest.created_at), "PPP")}</span>
                                <span className="font-semibold">Current Status:</span>
                                <span>{selectedRequest.status_display}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm font-semibold">Description:</span>
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    {selectedRequest.description || "N/A"}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-semibold">Admin Notes:</span>
                                <Textarea
                                    placeholder="Add notes or reasons for rejection..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                        {selectedRequest?.status === "PENDING" && (
                            <>
                                <Button variant="destructive" onClick={() => handleAction("REJECTED")}>
                                    Reject
                                </Button>
                                <Button variant="outline" onClick={() => handleAction("IN_PROGRESS")}>
                                    In Progress
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("APPROVED")}>
                                    Approve
                                </Button>
                            </>
                        )}
                        {selectedRequest?.status === "IN_PROGRESS" && (
                            <Button className="bg-green-600 hover:bg-green-700 w-full" onClick={() => handleAction("APPROVED")}>
                                Mark as Complete
                            </Button>
                        )}
                        {/* Allow reopening or re-evaluating if needed, or close button */}
                        {["APPROVED", "REJECTED"].includes(selectedRequest?.status || "") && (
                            <Button variant="secondary" onClick={() => setIsDialogOpen(false)} className="w-full">
                                Close
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
