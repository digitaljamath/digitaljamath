import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft, Printer, RotateCcw, Loader2, Check, X,
    TrendingUp, TrendingDown, FileText, Building2, User, Calendar
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

type JournalItem = {
    id: number;
    ledger_name: string;
    ledger_code: string;
    debit_amount: string;
    credit_amount: string;
    particulars: string;
};

type JournalEntry = {
    id: number;
    voucher_number: string;
    voucher_type: string;
    date: string;
    narration: string;
    total_amount: string;
    donor_name?: string;
    donor_name_manual?: string;
    donor_pan?: string;
    donor_intent?: string;
    supplier_name?: string;
    vendor_invoice_no?: string;
    vendor_invoice_date?: string;
    payment_mode: string;
    is_finalized: boolean;
    created_by_name?: string;
    created_at: string;
    items: JournalItem[];
};

export function VoucherDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const shouldPrint = searchParams.get('print') === '1';

    useEffect(() => {
        fetchEntry();
    }, [id]);

    useEffect(() => {
        if (shouldPrint && entry && !isLoading) {
            setTimeout(() => handlePrint(), 500);
        }
    }, [shouldPrint, entry, isLoading]);

    const fetchEntry = async () => {
        try {
            const res = await fetchWithAuth(`/api/ledger/journal-entries/${id}/`);
            if (res.ok) {
                const data = await res.json();
                setEntry(data);
            } else {
                setError("Entry not found");
            }
        } catch (err) {
            setError("Failed to load entry");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleReverse = async () => {
        if (!entry) return;
        if (!window.confirm(`Reverse entry ${entry.voucher_number}? This creates a contra entry.`)) return;

        try {
            const res = await fetchWithAuth(`/api/ledger/journal-entries/${id}/reverse/`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Reversed! New voucher: ${data.reversal_voucher}`);
                navigate(`/dashboard/finance/voucher/${data.reversal_id}`);
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed'}`);
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const getVoucherColor = (type: string) => {
        switch (type) {
            case 'RECEIPT': return 'border-green-500';
            case 'PAYMENT': return 'border-red-500';
            default: return 'border-blue-500';
        }
    };

    const getVoucherLabel = (type: string) => {
        switch (type) {
            case 'RECEIPT': return 'Receipt Voucher';
            case 'PAYMENT': return 'Payment Voucher';
            default: return 'Journal Entry';
        }
    };

    const getPaymentModeLabel = (mode: string) => {
        switch (mode) {
            case 'CASH': return 'Cash';
            case 'NEFT': return 'Bank Transfer (NEFT/IMPS)';
            case 'UPI': return 'UPI';
            case 'CHEQUE': return 'Cheque';
            default: return mode;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !entry) {
        return (
            <div className="text-center py-12">
                <X className="h-12 w-12 mx-auto text-red-400 mb-4" />
                <p className="text-red-600">{error || "Entry not found"}</p>
                <Button variant="outline" className="mt-4" asChild>
                    <Link to="/dashboard/finance/transactions">Back to Transactions</Link>
                </Button>
            </div>
        );
    }

    // Use correct party field based on voucher type
    const partyName = entry.voucher_type === 'RECEIPT'
        ? (entry.donor_name !== 'Unknown' ? entry.donor_name : null) || entry.donor_name_manual || 'Guest Donor'
        : entry.voucher_type === 'PAYMENT'
            ? entry.supplier_name || 'Direct Payment'
            : 'N/A';

    return (
        <div className="space-y-6">
            {/* Screen-only Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/dashboard/finance/transactions"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{entry.voucher_number}</h1>
                        <p className="text-gray-500 text-sm">{getVoucherLabel(entry.voucher_type)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                    {!entry.is_finalized && (
                        <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleReverse}>
                            <RotateCcw className="h-4 w-4 mr-2" /> Reverse
                        </Button>
                    )}
                </div>
            </div>

            {/* Printable Content */}
            <div ref={printRef} className="print:p-8">
                {/* Print Header */}
                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-2xl font-bold">Masjid Name</h1>
                    <p className="text-gray-500">Financial Record</p>
                </div>

                <Card className={`border-t-4 ${getVoucherColor(entry.voucher_type)}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{getVoucherLabel(entry.voucher_type)}</CardTitle>
                                <CardDescription className="mt-1">
                                    <code className="bg-gray-100 px-2 py-1 rounded">{entry.voucher_number}</code>
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className={`text-3xl font-bold ${entry.voucher_type === 'RECEIPT' ? 'text-green-600' :
                                    entry.voucher_type === 'PAYMENT' ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                    ₹{parseFloat(entry.total_amount || '0').toLocaleString('en-IN')}
                                </div>
                                {entry.is_finalized && (
                                    <Badge className="mt-2 bg-gray-100 text-gray-600">
                                        <Check className="h-3 w-3 mr-1" /> Finalized
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Date</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {new Date(entry.date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Payment Mode</p>
                                <p className="font-medium">{getPaymentModeLabel(entry.payment_mode)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">
                                    {entry.voucher_type === 'RECEIPT' ? 'Received From' : 'Paid To'}
                                </p>
                                <p className="font-medium flex items-center gap-1">
                                    <User className="h-4 w-4 text-gray-400" />
                                    {partyName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Created By</p>
                                <p className="font-medium">{entry.created_by_name || 'System'}</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Narration */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Narration</p>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{entry.narration}</p>
                        </div>

                        {/* Donor Intent (if receipt) */}
                        {entry.voucher_type === 'RECEIPT' && entry.donor_intent && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Donor's Specific Direction</p>
                                <p className="text-gray-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    {entry.donor_intent}
                                </p>
                            </div>
                        )}

                        {/* Vendor Invoice (if payment) */}
                        {entry.voucher_type === 'PAYMENT' && entry.vendor_invoice_no && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Vendor Invoice #</p>
                                    <p className="font-medium">{entry.vendor_invoice_no}</p>
                                </div>
                                {entry.vendor_invoice_date && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Invoice Date</p>
                                        <p className="font-medium">
                                            {new Date(entry.vendor_invoice_date).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        {/* Ledger Entries */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-2">Ledger Entries</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Account</th>
                                        <th className="text-right py-2">Debit (₹)</th>
                                        <th className="text-right py-2">Credit (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(entry.items || []).map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="py-2">
                                                <span className="text-gray-500 mr-2">{item.ledger_code}</span>
                                                {item.ledger_name}
                                            </td>
                                            <td className="text-right py-2 font-medium">
                                                {parseFloat(item.debit_amount) > 0
                                                    ? `₹${parseFloat(item.debit_amount).toLocaleString('en-IN')}`
                                                    : '-'}
                                            </td>
                                            <td className="text-right py-2 font-medium">
                                                {parseFloat(item.credit_amount) > 0
                                                    ? `₹${parseFloat(item.credit_amount).toLocaleString('en-IN')}`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Footer */}
                        <div className="hidden print:block mt-12 pt-8 border-t">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Printed on {new Date().toLocaleDateString('en-IN')}</span>
                                <span>This is a computer-generated document</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:p-8, .print\\:p-8 * {
                        visibility: visible;
                    }
                    .print\\:p-8 {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
