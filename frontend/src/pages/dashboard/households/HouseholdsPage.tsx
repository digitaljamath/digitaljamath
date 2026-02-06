import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Users, ChevronRight, ChevronLeft, Filter, X, MapPin, MessageSquare, Send, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { fetchWithAuth } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

type Member = {
    id: number;
    full_name: string;
    is_head_of_family: boolean;
    gender: string;
    marital_status: string;
    profession?: string;
    education?: string;
    age?: number;
};

type Household = {
    id: number;
    address: string;
    economic_status: string;
    housing_status?: string;
    zakat_score: number;
    membership_id?: string;
    member_count: number;
    head_name: string;
    phone_number?: string;
    is_verified?: boolean;
    members?: Member[];
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function HouseholdsPage() {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filter State
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [housingFilter, setHousingFilter] = useState<string>("ALL");
    const [memberCountFilter, setMemberCountFilter] = useState<string>("ALL");
    const [showFilters, setShowFilters] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Message Dialog State
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [messageText, setMessageText] = useState("");
    const [sendingId, setSendingId] = useState<number | null>(null);

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        async function fetchHouseholds() {
            setIsLoading(true);
            try {
                // Use Server-Side Search
                const query = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
                const res = await fetchWithAuth(`/api/jamath/households/${query}`);

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Status: ${res.status} - ${text.substring(0, 100)}`);
                }

                const data = await res.json();
                if (Array.isArray(data)) {
                    setHouseholds(data);
                } else {
                    // Handle pagination if backend enables it later (graceful fallback)
                    if (data.results && Array.isArray(data.results)) {
                        setHouseholds(data.results);
                    } else {
                        throw new Error("Invalid response format");
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch households", err);
                setError(err.message || "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        }
        fetchHouseholds();
    }, [debouncedSearch]); // Re-fetch when debounced search changes

    // Apply filters (Client-side for now, as backend only has Search)
    const filtered = useMemo(() => {
        return households.filter(h => {
            // Search is now handled by backend, so households already contains matches.
            // But we might want to keep local search for immediate feedback if we didn't use server-side?
            // No, mixed approach is confusing. Trust Server.

            const matchesStatus = statusFilter === "ALL" || h.economic_status === statusFilter;
            const matchesHousing = housingFilter === "ALL" || h.housing_status === housingFilter;

            let matchesMemberCount = true;
            if (memberCountFilter === "1") matchesMemberCount = h.member_count === 1;
            else if (memberCountFilter === "2-4") matchesMemberCount = h.member_count >= 2 && h.member_count <= 4;
            else if (memberCountFilter === "5+") matchesMemberCount = h.member_count >= 5;

            return matchesStatus && matchesHousing && matchesMemberCount;
        });
    }, [households, statusFilter, housingFilter, memberCountFilter]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, housingFilter, memberCountFilter, itemsPerPage]);

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("ALL");
        setHousingFilter("ALL");
        setMemberCountFilter("ALL");
    };

    const handleMessageClick = (householdId: number) => {
        setSelectedHouseholdId(householdId);
        setMessageText("");
        setIsMessageDialogOpen(true);
    };

    const sendMessage = async () => {
        if (!selectedHouseholdId) return;
        setSendingId(selectedHouseholdId);
        try {
            const body = {
                household_id: selectedHouseholdId,
                type: 'MESSAGE',
                message: messageText
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
                description: "Message sent successfully.",
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

    const activeFilterCount = [
        statusFilter !== "ALL",
        housingFilter !== "ALL",
        memberCountFilter !== "ALL"
    ].filter(Boolean).length;

    const getStatusBadge = (status: string) => {
        if (status === 'ZAKAT_ELIGIBLE') {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Zakat Eligible</Badge>;
        }
        return <Badge variant="secondary">Aam</Badge>;
    };

    const getHousingBadge = (status?: string) => {
        if (!status) return null;
        const colors: Record<string, string> = {
            'OWN': 'bg-blue-50 text-blue-700',
            'RENTED': 'bg-amber-50 text-amber-700',
            'FAMILY': 'bg-purple-50 text-purple-700'
        };
        const labels: Record<string, string> = {
            'OWN': 'Own',
            'RENTED': 'Rented',
            'FAMILY': 'Family'
        };
        return <span className={`px-2 py-0.5 rounded text-xs ${colors[status] || ''}`}>{labels[status] || status}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Households</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {filtered.length} of {households.length} households
                    </p>
                </div>
                <Button asChild>
                    <Link to="/dashboard/households/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Household
                    </Link>
                </Button>
            </div>

            {/* Search & Filter Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, address, ID, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge className="ml-2 bg-blue-600">{activeFilterCount}</Badge>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Economic Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        <SelectItem value="ZAKAT_ELIGIBLE">Zakat Eligible</SelectItem>
                                        <SelectItem value="AAM">Aam / Sahib-e-Nisab</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Housing Status</label>
                                <Select value={housingFilter} onValueChange={setHousingFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Housing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Housing</SelectItem>
                                        <SelectItem value="OWN">Own House</SelectItem>
                                        <SelectItem value="RENTED">Rented</SelectItem>
                                        <SelectItem value="FAMILY">Family Property</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Family Size</label>
                                <Select value={memberCountFilter} onValueChange={setMemberCountFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sizes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Sizes</SelectItem>
                                        <SelectItem value="1">Single Member</SelectItem>
                                        <SelectItem value="2-4">2-4 Members</SelectItem>
                                        <SelectItem value="5+">5+ Members</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="ghost"
                                    onClick={clearFilters}
                                    disabled={activeFilterCount === 0 && !search}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4 mr-2" /> Clear All
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Table */}
            {isLoading ? (
                <div className="text-center py-12">Loading...</div>
            ) : error ? (
                <div className="text-center text-red-500 py-12 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold">Error loading households:</p>
                    <p className="text-sm mt-1">{error}</p>
                    <p className="text-xs text-gray-500 mt-4">Try logging out and logging back in.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No households match your search or filters.</p>
                    {(search || activeFilterCount > 0) && (
                        <Button variant="link" onClick={clearFilters} className="mt-2">
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Head of Family</TableHead>
                                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                                    <TableHead>Economic Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Housing</TableHead>
                                    <TableHead className="text-center">Members</TableHead>
                                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.map((household) => (
                                    <TableRow key={household.id} className="hover:bg-gray-50">
                                        <TableCell className="font-mono text-xs text-blue-600">
                                            {household.membership_id || `#${household.id}`}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{household.head_name}</div>
                                                {household.is_verified && (
                                                    <Badge variant="outline" className="text-xs mt-1">Verified</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-start gap-2 max-w-xs">
                                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                                <span className="text-gray-600 text-sm line-clamp-2">{household.address}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(household.economic_status)}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {getHousingBadge(household.housing_status)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium">{household.member_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-gray-500">
                                            {household.phone_number || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Link to={`/dashboard/households/${household.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleMessageClick(household.id)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                title="Send Message"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Show</span>
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(v) => setItemsPerPage(Number(v))}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>per page</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages} ({filtered.length} results)
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            {/* Custom Message Dialog */}
            {
                isMessageDialogOpen && (
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
                                        onClick={sendMessage}
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
                )
            }
        </div >
    );
}
