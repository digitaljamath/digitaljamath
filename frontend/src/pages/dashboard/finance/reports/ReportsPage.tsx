import { getApiBaseUrl } from "@/lib/config";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Calendar, CheckCircle, XCircle, Download } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { Link } from "react-router-dom";

type DayBookEntry = {
    id: number;
    voucher_number: string;
    voucher_type: string;
    date: string;
    narration: string;
    total_amount: string;
    donor_name?: string;
    supplier_name?: string;
    is_zakat?: boolean;
    created_by_name?: string;
};

type TrialBalanceItem = {
    code: string;
    name: string;
    debit: number;
    credit: number;
};

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState("day-book");
    const [isLoading, setIsLoading] = useState(false);

    // Day Book State
    const [reportView, setReportView] = useState("GENERAL"); // Default to General to hide Zakat
    const [sortOrder, setSortOrder] = useState("newest");
    const [dayBookMode, setDayBookMode] = useState<"date" | "month">("date");
    const [dayBookDate, setDayBookDate] = useState(new Date().toISOString().split('T')[0]);
    const [dayBookEntries, setDayBookEntries] = useState<DayBookEntry[]>([]);
    const [dayBookSummary, setDayBookSummary] = useState({ total_receipts: 0, total_payments: 0 });

    // Trial Balance State
    const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
    const [trialBalanceTotals, setTrialBalanceTotals] = useState({ debit: 0, credit: 0, is_balanced: true });

    // Export State
    const currentYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const [exportYear, setExportYear] = useState(currentYear.toString());
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem("access_token");

            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/api/ledger/export/?year=${exportYear}`, {
                headers: { Authorization: `Bearer ${token || ''}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Mizan_Export_FY${exportYear}-${parseInt(exportYear) + 1}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        } catch (err) {
            console.error("Export failed", err);
        } finally {
            setIsExporting(false);
        }
    };

    const fetchDayBook = async () => {
        setIsLoading(true);
        try {
            let formattedDate = dayBookDate;
            if (dayBookMode === 'month' && dayBookDate.length === 7) {
                formattedDate = `${dayBookDate}-01`;
            } else if (dayBookMode === 'date' && dayBookDate.length === 7) {
                formattedDate = `${dayBookDate}-01`;
            } else if (dayBookMode === 'month' && dayBookDate.length === 10) {
                // Ignore the -DD part for backend if it still sends YYYY-MM-DD
                formattedDate = `${dayBookDate.substring(0, 7)}-01`;
            }

            let url = `/api/ledger/reports/day-book/?date=${formattedDate}&sort=${sortOrder}&mode=${dayBookMode}`;
            if (reportView !== 'ALL') {
                url += `&fund_type=${reportView}`;
            }

            const res = await fetchWithAuth(url);
            if (res.ok) {
                const data = await res.json();
                setDayBookEntries(data.entries || []);
                setDayBookSummary(data.summary || { total_receipts: 0, total_payments: 0 });
            }
        } catch (err) {
            console.error("Failed to fetch day book", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrialBalance = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth('/api/ledger/reports/trial-balance/');
            if (res.ok) {
                const data = await res.json();
                setTrialBalance(data.ledgers || []);
                setTrialBalanceTotals({
                    debit: parseFloat(data.total_debit) || 0,
                    credit: parseFloat(data.total_credit) || 0,
                    is_balanced: data.is_balanced
                });
            }
        } catch (err) {
            console.error("Failed to fetch trial balance", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'day-book') {
            fetchDayBook();
        } else if (activeTab === 'trial-balance') {
            fetchTrialBalance();
        }
    }, [activeTab, dayBookDate, reportView, sortOrder]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Financial Reports</h1>
                    <p className="text-gray-500 text-sm">Day Book, Trial Balance, and more</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="day-book">Day Book (Roznamcha)</TabsTrigger>
                    <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                    <TabsTrigger value="export">Export to Excel</TabsTrigger>
                </TabsList>

                {/* Day Book */}
                <TabsContent value="day-book">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Day Book</CardTitle>
                                    <CardDescription>Daily record of all transactions</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-slate-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setReportView('GENERAL')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportView === 'GENERAL' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            General
                                        </button>
                                        <button
                                            onClick={() => setReportView('ZAKAT')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportView === 'ZAKAT' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            Zakat Only
                                        </button>
                                        <button
                                            onClick={() => setReportView('ALL')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportView === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            All
                                        </button>
                                    </div>
                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setDayBookMode('date')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dayBookMode === 'date' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                Daily
                                            </button>
                                            <button
                                                onClick={() => setDayBookMode('month')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dayBookMode === 'month' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                Monthly
                                            </button>
                                        </div>
                                        <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setSortOrder('newest')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortOrder === 'newest' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                Newest
                                            </button>
                                            <button
                                                onClick={() => setSortOrder('oldest')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortOrder === 'oldest' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                Oldest
                                            </button>
                                        </div>
                                        <div className="h-4 w-px bg-gray-300 mx-1"></div>
                                        <Label>{dayBookMode === 'month' ? 'Month:' : 'Date:'}</Label>
                                        <Input
                                            type={dayBookMode === 'month' ? 'month' : 'date'}
                                            value={dayBookMode === 'month' && dayBookDate.length === 10 ? dayBookDate.substring(0, 7) : dayBookDate}
                                            onChange={(e) => setDayBookDate(e.target.value)}
                                            className="w-36 h-9"
                                        />
                                        <Button onClick={fetchDayBook} disabled={isLoading} size="sm">
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : dayBookEntries.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                    <p>No transactions for this date.</p>
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Voucher #</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Narration</TableHead>
                                                <TableHead>Party</TableHead>
                                                <TableHead>Created By</TableHead>
                                                <TableHead className="text-right">Amount (₹)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dayBookEntries.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="font-mono text-sm">{entry.voucher_number}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={entry.voucher_type === 'RECEIPT' ? 'default' : entry.voucher_type === 'PAYMENT' ? 'destructive' : 'secondary'}>
                                                            {entry.voucher_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span>{entry.narration}</span>
                                                            {entry.is_zakat && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-200 text-blue-700 bg-blue-50">
                                                                    Zakat
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{entry.donor_name || entry.supplier_name || '-'}</TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {entry.created_by_name ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                                {entry.created_by_name}
                                                            </span>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-medium ${entry.voucher_type === 'RECEIPT' ? 'text-green-600' : entry.voucher_type === 'PAYMENT' ? 'text-red-600' : ''}`}>
                                                        {entry.voucher_type === 'RECEIPT' ? '+' : entry.voucher_type === 'PAYMENT' ? '-' : ''}
                                                        {parseFloat(entry.total_amount || '0').toLocaleString('en-IN')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Summary */}
                                    <div className="mt-6 grid grid-cols-3 gap-4">
                                        <Card className="bg-green-50 border-green-200">
                                            <CardContent className="pt-4">
                                                <p className="text-sm text-green-600">Total Receipts</p>
                                                <p className="text-2xl font-bold text-green-700">₹{dayBookSummary.total_receipts.toLocaleString('en-IN')}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-red-50 border-red-200">
                                            <CardContent className="pt-4">
                                                <p className="text-sm text-red-600">Total Payments</p>
                                                <p className="text-2xl font-bold text-red-700">₹{dayBookSummary.total_payments.toLocaleString('en-IN')}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-blue-50 border-blue-200">
                                            <CardContent className="pt-4">
                                                <p className="text-sm text-blue-600">Net Cash Flow</p>
                                                <p className="text-2xl font-bold text-blue-700">
                                                    ₹{(dayBookSummary.total_receipts - dayBookSummary.total_payments).toLocaleString('en-IN')}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trial Balance */}
                <TabsContent value="trial-balance">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Trial Balance</CardTitle>
                                    <CardDescription>Summary of all ledger balances</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {trialBalanceTotals.is_balanced ? (
                                        <Badge className="bg-green-100 text-green-700">
                                            <CheckCircle className="h-4 w-4 mr-1" /> Balanced
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-700">
                                            <XCircle className="h-4 w-4 mr-1" /> Unbalanced
                                        </Badge>
                                    )}
                                    <Button onClick={fetchTrialBalance} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : trialBalance.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No ledger entries found.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead className="text-right">Debit (₹)</TableHead>
                                            <TableHead className="text-right">Credit (₹)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trialBalance.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.debit > 0 ? item.debit.toLocaleString('en-IN') : '-'}</TableCell>
                                                <TableCell className="text-right">{item.credit > 0 ? item.credit.toLocaleString('en-IN') : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Totals Row */}
                                        <TableRow className="font-bold bg-gray-50">
                                            <TableCell colSpan={2} className="text-right">Total</TableCell>
                                            <TableCell className="text-right">{trialBalanceTotals.debit.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-right">{trialBalanceTotals.credit.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Export to Excel */}
                <TabsContent value="export">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Financial Year to Excel</CardTitle>
                            <CardDescription>
                                Generate a Tally-compatible Excel file with all journal entries and donor information for Form 10BD filing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Financial Year Starting</Label>
                                        <select
                                            value={exportYear}
                                            onChange={(e) => setExportYear(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                        >
                                            {[0, 1, 2, 3, 4].map(offset => {
                                                const y = currentYear - offset;
                                                return (
                                                    <option key={y} value={y}>
                                                        FY {y}-{y + 1} (Apr {y} to Mar {y + 1})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <Button onClick={handleExport} disabled={isExporting} className="w-full">
                                        {isExporting ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                                        ) : (
                                            <><Download className="h-4 w-4 mr-2" /> Download Excel File</>
                                        )}
                                    </Button>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <h4 className="font-medium">Export Contents:</h4>
                                    <ul className="text-sm text-gray-600 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                            <span><strong>Tab 1: Journal Entries</strong> - All transactions with Date, Voucher Type, Ledger, Fund Category, Debit/Credit amounts</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                            <span><strong>Tab 2: Donor List</strong> - Aggregated donor information with Name, PAN, Phone, Total Donation for Form 10BD</span>
                                        </li>
                                    </ul>
                                    <p className="text-xs text-gray-500 pt-2 border-t">
                                        Dates are formatted as DD-MM-YYYY for Indian accounting standards.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
