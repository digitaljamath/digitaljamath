import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Calendar } from "lucide-react";

type ActivityLog = {
    id: number;
    username: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    module: string;
    model_name: string;
    details: string;
    timestamp: string;
};

export function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [staffList, setStaffList] = useState<{ id: number, name: string, type: string }[]>([]);

    // Filters
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [moduleFilter, setModuleFilter] = useState("ALL");
    const [staffFilter, setStaffFilter] = useState("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
        fetchStaff();
    }, [actionFilter, moduleFilter, staffFilter, startDate, endDate]); // Trigger re-fetch on filter change

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchStaff = async () => {
        try {
            const res = await fetchWithAuth('/api/jamath/activity-log-staff/');
            if (res.ok) {
                const data = await res.json();
                setStaffList(data);
            }
        } catch (e) {
            console.error("Failed to load staff list");
        }
    };

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (actionFilter !== 'ALL') params.append('action', actionFilter);
            if (moduleFilter !== 'ALL') params.append('module', moduleFilter);
            if (staffFilter !== 'ALL') params.append('staff_id', staffFilter);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const res = await fetchWithAuth(`/api/jamath/activity-logs/?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.results || data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setActionFilter("ALL");
        setModuleFilter("ALL");
        setStaffFilter("ALL");
        setStartDate("");
        setEndDate("");
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/users')}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Staff Activity Logs</h1>
                    </div>
                    <p className="text-muted-foreground pl-20">Audit trail of all staff actions.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search details..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant={showFilters ? "secondary" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2 animate-in slide-in-from-top-2">
                        {/* Start Date */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">From</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">To</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Staff */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Staff</label>
                            <Select value={staffFilter} onValueChange={setStaffFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Staff" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Staff</SelectItem>
                                    {staffList.map(staff => (
                                        <SelectItem key={staff.id} value={String(staff.id)}>
                                            <span className="flex items-center gap-2">
                                                {staff.name}
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal">
                                                    {staff.type}
                                                </Badge>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Action</label>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Module */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Module</label>
                            <Select value={moduleFilter} onValueChange={setModuleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Modules" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Modules</SelectItem>
                                    <SelectItem value="jamath">Jamath</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="announcements">Announcements</SelectItem>
                                    <SelectItem value="users">Users</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-5 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                <X className="h-4 w-4 mr-1" /> Clear Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="border rounded-lg bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Module / Model</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Loader2 className="animate-spin h-6 w-6" />
                                        <p>Loading logs...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                    No activity recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap text-gray-600">
                                        {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                                    </TableCell>
                                    <TableCell className="font-medium">{log.username || "Unknown"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getActionColor(log.action)}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{log.model_name}</span>
                                            <span className="text-xs text-gray-500">{log.module || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md truncate" title={log.details}>
                                        <span className={
                                            log.details.startsWith("Received Payment") ? "text-green-600 font-medium" :
                                                log.details.startsWith("Made Payment") ? "text-red-600 font-medium" :
                                                    ""
                                        }>
                                            {log.details}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
