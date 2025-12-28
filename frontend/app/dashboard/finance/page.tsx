"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";

type Transaction = {
    id: number;
    amount: string;
    description: string;
    is_expense: boolean;
    date: string;
    linked_household?: { id: number; address: string }; // Depth might not be 1? Let's check api.
    // If api depth=1 was removed, we just get ID. Frontend needs to handle that.
    // Actually for listing, just ID is fine, or we fetch details.
    // Just display basics for now.
};

export default function FinancePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const res = await fetch("/api/finance/transactions/");
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data);
                }
            } catch (error) {
                console.error("Failed to fetch transactions", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTransactions();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
                <Button asChild>
                    <Link href="/dashboard/finance/new">
                        <Plus className="mr-2 h-4 w-4" /> Record Transaction
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No transactions recorded yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${tx.is_expense ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {tx.is_expense ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{tx.description}</p>
                                            <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`text-right font-bold ${tx.is_expense ? 'text-red-600' : 'text-green-600'}`}>
                                        {tx.is_expense ? '-' : '+'} ₹{parseFloat(tx.amount).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
