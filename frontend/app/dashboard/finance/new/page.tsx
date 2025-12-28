"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Types
type FundCategory = { id: number; name: string };
type Household = { id: number; address: string };

export default function NewTransactionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<FundCategory[]>([]);
    const [households, setHouseholds] = useState<Household[]>([]);

    // Form State
    const [type, setType] = useState<"income" | "expense">("income");

    // Fetch dependencies
    useEffect(() => {
        async function loadData() {
            try {
                const [catRes, hhRes] = await Promise.all([
                    fetch("/api/finance/funds/"),
                    fetch("/api/jamath/households/")
                ]);

                if (catRes.ok) setCategories(await catRes.json());
                if (hhRes.ok) setHouseholds(await hhRes.json());
            } catch (e) {
                console.error(e);
            }
        }
        loadData();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const linkedHouseholdValue = formData.get("linked_household");

        const data = {
            description: formData.get("description"),
            amount: formData.get("amount"),
            fund_category: formData.get("fund_category"),
            is_expense: type === "expense",
            linked_household: linkedHouseholdValue === "none" ? null : linkedHouseholdValue
        };

        try {
            const res = await fetch("/api/finance/transactions/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push("/dashboard/finance");
                router.refresh();
            } else {
                const err = await res.json();
                alert("Failed: " + JSON.stringify(err));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Record Transaction</h1>

            <Card>
                <CardHeader>
                    <div className="flex space-x-4 mb-4">
                        <Button
                            variant={type === "income" ? "default" : "outline"}
                            className={type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => setType("income")}
                        >
                            Income (Donation)
                        </Button>
                        <Button
                            variant={type === "expense" ? "default" : "outline"}
                            className={type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => setType("expense")}
                        >
                            Expense
                        </Button>
                    </div>
                    <CardTitle>{type === "income" ? "Record Income / Donation" : "Record Expense"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input name="description" id="description" required placeholder="e.g. Friday Collection or Electricity Bill" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input name="amount" id="amount" type="number" step="0.01" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fund_category">Fund Category</Label>
                            <Select name="fund_category" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Fund" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {type === 'income' && (
                            <div className="space-y-2">
                                <Label htmlFor="linked_household">Linked Household (Optional)</Label>
                                <Select name="linked_household">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Donor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- None --</SelectItem>
                                        {households.map(h => (
                                            <SelectItem key={h.id} value={h.id.toString()}>
                                                {h.address.substring(0, 30)}... (ID: {h.id})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">Link this donation to a specific household/member.</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Record"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
