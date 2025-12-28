"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Receipt } from "lucide-react";

type ReceiptData = {
    id: number;
    receipt_number: string;
    amount: string;
    membership_portion: string;
    donation_portion: string;
    payment_date: string;
    pdf_url?: string;
};

export default function PortalReceiptsPage() {
    const router = useRouter();
    const [receipts, setReceipts] = useState<ReceiptData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/portal/login");
            return;
        }
        fetchReceipts(token);
    }, [router]);

    const fetchReceipts = async (token: string) => {
        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/portal/receipts/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setReceipts(data);
            }
        } catch (err) {
            console.error("Failed to fetch receipts", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="font-bold text-lg ml-4">Receipt Vault</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading receipts...</div>
                ) : receipts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No payment receipts yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {receipts.map((receipt) => (
                            <Card key={receipt.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-mono">
                                            {receipt.receipt_number}
                                        </CardTitle>
                                        <Badge variant="outline">
                                            {new Date(receipt.payment_date).toLocaleDateString('en-IN')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹{parseFloat(receipt.amount).toLocaleString('en-IN')}
                                            </p>
                                            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                                <p>Membership: ₹{parseFloat(receipt.membership_portion).toLocaleString('en-IN')}</p>
                                                {parseFloat(receipt.donation_portion) > 0 && (
                                                    <p>Sadaqah: ₹{parseFloat(receipt.donation_portion).toLocaleString('en-IN')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" disabled={!receipt.pdf_url}>
                                            <Download className="h-4 w-4 mr-2" /> PDF
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
