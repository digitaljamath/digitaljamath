import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Plus, Receipt, CreditCard, FileText, BarChart3,
    Wallet, Building2, TrendingUp, TrendingDown, Loader2, RotateCcw
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { List } from "lucide-react";

type JournalEntry = {
    id: number;
    voucher_number: string;
    voucher_type: string;
    date: string;
    narration: string;
    total_amount: string;
    donor_name?: string;
    supplier_name?: string;
};

type LedgerAccount = {
    id: number;
    code: string;
    name: string;
    account_type: string;
    balance: string;
};

export function FinancePage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [entriesRes, accountsRes] = await Promise.all([
                    fetchWithAuth('/api/ledger/journal-entries/'),
                    fetchWithAuth('/api/ledger/accounts/?flat=1')
                ]);

                if (entriesRes.ok) {
                    const data = await entriesRes.json();
                    setEntries(data.slice(0, 10));
                }

                if (accountsRes.ok) {
                    const data = await accountsRes.json();
                    setAccounts(data);
                }
            } catch (error) {
                console.error("Failed to fetch finance data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Calculate summary balances
    const cashBalance = accounts
        .filter(a => ['1001', '1002'].includes(a.code))
        .reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0);

    const zakatBalance = accounts
        .filter(a => a.code === '1003')
        .reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0);

    const getVoucherIcon = (type: string) => {
        switch (type) {
            case 'RECEIPT': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'PAYMENT': return <TrendingDown className="h-4 w-4 text-red-500" />;
            default: return <FileText className="h-4 w-4 text-blue-500" />;
        }
    };

    const getVoucherColor = (type: string) => {
        switch (type) {
            case 'RECEIPT': return 'bg-green-50 border-green-200';
            case 'PAYMENT': return 'bg-red-50 border-red-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    const handleReverse = async (id: number, voucherNo: string) => {
        if (!window.confirm(`Are you sure you want to REVERSE entry ${voucherNo}? This creates a contra entry.`)) return;

        try {
            const res = await fetchWithAuth(`/api/ledger/journal-entries/${id}/reverse/`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Success! Reversal Voucher: ${data.reversal_voucher}`);
                window.location.reload();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to reverse entry'}`);
            }
        } catch (err) {
            alert('Failed to connect to server.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Baitul Maal</h1>
                    <p className="text-gray-500 mt-1">The Mizan Ledger - Double-Entry Accounting</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/dashboard/finance/accounts">
                            <Building2 className="mr-2 h-4 w-4" /> Chart of Accounts
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link to="/dashboard/finance/voucher">
                            <Plus className="mr-2 h-4 w-4" /> New Entry
                        </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                        <Link to="/dashboard/finance/transactions">
                            <List className="mr-2 h-4 w-4" /> View All
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Cash & Bank</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{cashBalance.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Zakat Fund</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{zakatBalance.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">This Month Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹0</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">This Month Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹0</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/dashboard/finance/voucher?type=RECEIPT">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-300">
                        <CardContent className="pt-6 text-center">
                            <Receipt className="h-8 w-8 mx-auto text-green-500 mb-2" />
                            <p className="font-medium">Receipt Voucher</p>
                            <p className="text-xs text-gray-500">Record Income</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/finance/voucher?type=PAYMENT">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-red-300">
                        <CardContent className="pt-6 text-center">
                            <CreditCard className="h-8 w-8 mx-auto text-red-500 mb-2" />
                            <p className="font-medium">Payment Voucher</p>
                            <p className="text-xs text-gray-500">Record Expense</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/finance/voucher?type=JOURNAL">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300">
                        <CardContent className="pt-6 text-center">
                            <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                            <p className="font-medium">Journal Entry</p>
                            <p className="text-xs text-gray-500">Adjustments</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/finance/reports">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300">
                        <CardContent className="pt-6 text-center">
                            <BarChart3 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                            <p className="font-medium">Reports</p>
                            <p className="text-xs text-gray-500">Day Book, Trial Balance</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Entries */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Last 10 journal entries</CardDescription>
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p>No transactions recorded yet.</p>
                            <p className="text-sm mt-2">Start by creating a Receipt or Payment voucher.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${getVoucherColor(entry.voucher_type)}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-full bg-white shadow-sm">
                                            {getVoucherIcon(entry.voucher_type)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{entry.narration}</p>
                                            <p className="text-sm text-gray-500">
                                                {entry.voucher_number} • {new Date(entry.date).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${entry.voucher_type === 'RECEIPT' ? 'text-green-600' : entry.voucher_type === 'PAYMENT' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {entry.voucher_type === 'RECEIPT' ? '+' : entry.voucher_type === 'PAYMENT' ? '-' : ''}
                                            ₹{parseFloat(entry.total_amount || '0').toLocaleString('en-IN')}
                                        </p>
                                        <div className="flex justify-end items-center gap-2 mt-1">
                                            <p className="text-xs text-gray-500">
                                                {entry.donor_name || entry.supplier_name || ''}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                title="Reverse Entry"
                                                onClick={() => handleReverse(entry.id, entry.voucher_number)}
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
