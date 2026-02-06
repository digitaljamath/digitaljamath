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
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetchWithAuth('/api/jamath/activity-logs/');
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
