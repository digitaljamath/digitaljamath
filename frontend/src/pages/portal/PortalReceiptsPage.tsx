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
            const token = localStorage.getItem('portal_access_token');
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
            const token = localStorage.getItem('portal_access_token');
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
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header / App Bar */}
            <header className="bg-white border-b sticky top-0 z-50 h-[56px] flex items-center shadow-sm">
                <div className="w-full max-w-[420px] mx-auto px-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="active:scale-95 transition-transform">
                        <Link to="/portal/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="font-bold text-lg tracking-tight text-gray-900">Receipt Vault</h1>
                </div>
            </header>

            <main className="w-full max-w-[420px] mx-auto px-4 py-6 flex-1">
                <Card className="border-0 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-5 w-5 text-green-600" />
                            Your Receipts
                        </CardTitle>
                        <CardDescription className="text-xs">
                            All your membership and donation payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        ) : receipts.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600">No Receipts Found</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Your payment receipts will appear here after you make a contribution.
                                </p>
                                <Button asChild className="mt-4 rounded-xl" variant="outline">
                                    <Link to="/portal/dashboard">Back to Dashboard</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {receipts.map((receipt) => (
                                    <div key={receipt.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-mono text-sm font-bold text-gray-800">{receipt.receipt_number}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-400">
                                                    {format(new Date(receipt.date), 'dd MMM yyyy')}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] h-5">{receipt.payment_mode}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900">₹{receipt.amount.toLocaleString()}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-lg active:scale-95 transition-transform"
                                                onClick={() => downloadReceipt(receipt.id, receipt.receipt_number)}
                                                disabled={downloadingId === receipt.id}
                                            >
                                                {downloadingId === receipt.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-[11px] text-gray-400 mt-6">
                    Receipts are eligible for 80G tax exemption benefits where applicable.
                </p>
            </main>
        </div>
    );
}
