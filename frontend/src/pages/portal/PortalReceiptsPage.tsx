import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText, Loader2, Calendar, IndianRupee } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Receipt {
    id: number;
    receipt_number: string;
    date: string;
    amount: number;
    description: string;
    payment_mode: string;
}

export function PortalReceiptsPage() {
    const navigate = useNavigate();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/portal/receipts/list/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setReceipts(data);
            } else if (res.status === 401) {
                navigate('/portal/login');
            }
        } catch (err) {
            console.error("Failed to fetch receipts", err);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadReceipt = async (receiptId: number, receiptNumber: string) => {
        setDownloadingId(receiptId);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/portal/receipts/${receiptId}/pdf/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Receipt_${receiptNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Failed to download receipt", err);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/portal">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
                        <p className="text-sm text-gray-500">View and download your payment receipts</p>
                    </div>
                </div>

                {/* Receipts Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-600" />
                            Your Receipts
                        </CardTitle>
                        <CardDescription>
                            All your membership and donation payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            </div>
                        ) : receipts.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600">No Receipts Found</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Your payment receipts will appear here after you make a contribution.
                                </p>
                                <Button asChild className="mt-4" variant="outline">
                                    <Link to="/portal">Back to Dashboard</Link>
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Receipt #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receipts.map((receipt) => (
                                        <TableRow key={receipt.id}>
                                            <TableCell className="font-mono text-sm">
                                                {receipt.receipt_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    {format(new Date(receipt.date), 'dd MMM yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate">
                                                    {receipt.description || 'Membership Payment'}
                                                </div>
                                                <Badge variant="outline" className="text-xs mt-1">
                                                    {receipt.payment_mode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                <div className="flex items-center justify-end gap-1">
                                                    <IndianRupee className="h-3 w-3" />
                                                    {receipt.amount.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => downloadReceipt(receipt.id, receipt.receipt_number)}
                                                    disabled={downloadingId === receipt.id}
                                                >
                                                    {downloadingId === receipt.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Download className="h-4 w-4 mr-1" />
                                                            PDF
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Info Note */}
                <div className="text-center text-sm text-gray-500">
                    <p>Receipts are eligible for 80G tax exemption benefits where applicable.</p>
                </div>
            </div>
        </div>
    );
}
