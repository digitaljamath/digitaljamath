import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Plus, Eye, Printer, RotateCcw, Download, Loader2,
    TrendingUp, TrendingDown, FileText, Search, Filter
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { QuickEntry } from "./components/QuickEntry";

type JournalEntry = {
    id: number;
    voucher_number: string;
    voucher_type: string;
    date: string;
    narration: string;
    total_amount: string;
    donor_name?: string;
    supplier_name?: string;
    created_by_name?: string;
    is_finalized: boolean;
};

export function TransactionsPage() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Filters
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [voucherType, setVoucherType] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchEntries();
    }, [dateFrom, dateTo, voucherType]);

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            let url = '/api/ledger/journal-entries/?';
            if (dateFrom) url += `from=${dateFrom}&`;
            if (dateTo) url += `to=${dateTo}&`;
            if (voucherType && voucherType !== 'ALL') url += `type=${voucherType}&`;

            const res = await fetchWithAuth(url);
            if (res.ok) {
                const data = await res.json();
                setEntries(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error("Failed to fetch entries", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReverse = async (id: number, voucherNo: string) => {
        if (!window.confirm(`Reverse entry ${voucherNo}? This creates a contra entry.`)) return;

        try {
            const res = await fetchWithAuth(`/api/ledger/journal-entries/${id}/reverse/`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Reversed! New voucher: ${data.reversal_voucher}`);
                fetchEntries();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed'}`);
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Build CSV from current entries
            const headers = ['Date', 'Voucher #', 'Type', 'Narration', 'Amount', 'Party', 'Created By'];
            const rows = entries.map(e => [
                e.date,
                e.voucher_number,
                e.voucher_type,
                `"${e.narration.replace(/"/g, '""')}"`,
                e.total_amount,
                e.donor_name || e.supplier_name || '',
                e.created_by_name || ''
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredEntries = entries.filter(e => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            e.voucher_number.toLowerCase().includes(q) ||
            e.narration.toLowerCase().includes(q) ||
            (e.donor_name || '').toLowerCase().includes(q) ||
            (e.supplier_name || '').toLowerCase().includes(q)
        );
    });

    const getVoucherIcon = (type: string) => {
        switch (type) {
            case 'RECEIPT': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'PAYMENT': return <TrendingDown className="h-4 w-4 text-red-500" />;
            default: return <FileText className="h-4 w-4 text-blue-500" />;
        }
    };

    const getVoucherBadge = (type: string) => {
        switch (type) {
            case 'RECEIPT': return <Badge className="bg-green-100 text-green-700">Receipt</Badge>;
            case 'PAYMENT': return <Badge className="bg-red-100 text-red-700">Payment</Badge>;
            default: return <Badge className="bg-blue-100 text-blue-700">Journal</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">All Transactions</h1>
                        <p className="text-gray-500 text-sm">View, search, and manage all journal entries</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* AI Quick Entry */}
            <QuickEntry />

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">From Date</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">To Date</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Voucher Type</Label>
                            <Select value={voucherType} onValueChange={setVoucherType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Types</SelectItem>
                                    <SelectItem value="RECEIPT">Receipt</SelectItem>
                                    <SelectItem value="PAYMENT">Payment</SelectItem>
                                    <SelectItem value="JOURNAL">Journal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search voucher #, narration, party..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Voucher #</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Narration</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Party</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.map((entry) => (
                                    <TableRow key={entry.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {new Date(entry.date).toLocaleDateString('en-IN')}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {entry.voucher_number}
                                            </code>
                                        </TableCell>
                                        <TableCell>{getVoucherBadge(entry.voucher_type)}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={entry.narration}>
                                            {entry.narration}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${entry.voucher_type === 'RECEIPT' ? 'text-green-600' :
                                            entry.voucher_type === 'PAYMENT' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                            {entry.voucher_type === 'RECEIPT' ? '+' : entry.voucher_type === 'PAYMENT' ? '-' : ''}
                                            ₹{parseFloat(entry.total_amount || '0').toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {entry.donor_name || entry.supplier_name || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {entry.created_by_name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="View Details"
                                                    onClick={() => navigate(`/dashboard/finance/voucher/${entry.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Print Receipt"
                                                    onClick={() => navigate(`/dashboard/finance/voucher/${entry.id}?print=1`)}
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                {!entry.is_finalized && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                        title="Reverse Entry"
                                                        onClick={() => handleReverse(entry.id, entry.voucher_number)}
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Entry Count */}
            <div className="text-sm text-gray-500 text-center">
                Showing {filteredEntries.length} of {entries.length} entries
            </div>
        </div>
    );
}
