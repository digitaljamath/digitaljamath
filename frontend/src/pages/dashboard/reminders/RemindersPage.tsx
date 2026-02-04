import React, { useState, useEffect } from 'react';
import {
    Users,
    Bell,
    MessageSquare,
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
    X,
    Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";  // Assuming you have this, otherwise we use standard textarea

interface Member {
    id: number;
    full_name: string;
    is_head_of_family: boolean;
}

interface Household {
    id: number;
    head_name: string;
    membership_id: string;
    is_membership_active: boolean;
    member_count: number;
    members: Member[];
}

export const RemindersPage: React.FC = () => {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [sendingId, setSendingId] = useState<number | null>(null);

    // Message Dialog State
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [messageText, setMessageText] = useState("");

    useEffect(() => {
        fetchHouseholds();
    }, []);

    const fetchHouseholds = async () => {
        try {
            const response = await fetchWithAuth('/api/jamath/households/');
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            // Handle pagination or direct array
            const results = Array.isArray(data) ? data : (data.results || []);
            setHouseholds(results);
        } catch (error) {
            console.error("Failed to fetch households:", error);
            toast({
                title: "Error",
                description: "Could not load households list.",
                variant: "destructive"
            });
            setHouseholds([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (householdId: number, type: 'REMINDER' | 'MESSAGE') => {
        if (type === 'MESSAGE') {
            setSelectedHouseholdId(householdId);
            setMessageText("");
            setIsMessageDialogOpen(true);
        } else {
            // Instant send for standard reminders
            sendData(householdId, 'REMINDER');
        }
    };

    const sendData = async (householdId: number, type: 'REMINDER' | 'MESSAGE', text: string = "") => {
        setSendingId(householdId);
        try {
            const body = {
                household_id: householdId,
                type: type,
                message: text
            };

            const response = await fetchWithAuth('/api/jamath/reminders/send/', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || err.detail || "Failed to send");
            }

            toast({
                title: "Success",
                description: type === 'REMINDER'
                    ? "Reminder sent successfully."
                    : "Message sent successfully.",
            });
            setIsMessageDialogOpen(false);
        } catch (error: any) {
            console.error("Failed to send:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send.",
                variant: "destructive"
            });
        } finally {
            setSendingId(null);
        }
    };

    const filteredHouseholds = households.filter(h =>
        (h.head_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (h.membership_id || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Communication Center</h1>
                    <p className="text-gray-500">Send renewal reminders and messages to member portals</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Pending Renewals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-900">
                            {households.filter(h => !h.is_membership_active).length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-blue-800 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Total Families
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-900">{households.length}</div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-emerald-800 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Active Memberships
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">
                            {households.filter(h => h.is_membership_active).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Member Households</CardTitle>
                            <CardDescription>Targeted communication for family heads</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Family Head</th>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                            <Clock className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading households...
                                        </td>
                                    </tr>
                                ) : filteredHouseholds.map((h) => (
                                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-gray-900">{h.head_name}</div>
                                            <div className="text-xs text-gray-500">{h.member_count} Members</div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 font-mono text-xs">{h.membership_id}</td>
                                        <td className="px-4 py-4">
                                            {h.is_membership_active ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Expired</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleActionClick(h.id, 'REMINDER')}
                                                disabled={sendingId === h.id}
                                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                            >
                                                <Bell className="h-4 w-4 mr-1" />
                                                Remind
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleActionClick(h.id, 'MESSAGE')}
                                                disabled={sendingId === h.id}
                                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                            >
                                                <MessageSquare className="h-4 w-4 mr-1" />
                                                Message
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Message Dialog */}
            {isMessageDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md shadow-xl bg-white animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Send Custom Message</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsMessageDialogOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500">
                                This message will appear in the member's portal announcement board.
                            </p>
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-md border text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Type your message here..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => selectedHouseholdId && sendData(selectedHouseholdId, 'MESSAGE', messageText)}
                                    disabled={!messageText.trim() || sendingId !== null}
                                >
                                    {sendingId ? (
                                        <Clock className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Send Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default RemindersPage;
