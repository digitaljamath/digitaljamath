"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";

type Ledger = {
    id: number;
    code: string;
    name: string;
    account_type: string;
    fund_type: string | null;
};

type Supplier = {
    id: number;
    name: string;
};

type Member = {
    id: number;
    full_name: string;
};

type JournalItem = {
    ledger: number;
    debit_amount: number;
    credit_amount: number;
    particulars: string;
};

// Available Fund Categories matching Backend Choices
const FUND_CATEGORIES = [
    { value: 'GENERAL', label: 'General / Unrestricted' },
    { value: 'ZAKAT', label: 'Zakat (Restricted)' },
    { value: 'SADAQAH', label: 'Sadaqah (Restricted)' },
    { value: 'CONSTRUCTION', label: 'Construction (Restricted)' },
];


function VoucherFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') || 'RECEIPT';

    const [voucherType, setVoucherType] = useState(initialType);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Accounts & Masters
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [narration, setNarration] = useState("");
    const [paymentMode, setPaymentMode] = useState("CASH");

    // Receipt Fields
    const [donorId, setDonorId] = useState<string>("");
    const [donorNameManual, setDonorNameManual] = useState("");
    const [donorPan, setDonorPan] = useState("");
    const [donorIntent, setDonorIntent] = useState("");
    const [fundCategory, setFundCategory] = useState<string>("");

    // Payment Fields
    const [supplierId, setSupplierId] = useState<string>("");
    const [vendorInvoiceNo, setVendorInvoiceNo] = useState("");
    const [vendorInvoiceDate, setVendorInvoiceDate] = useState("");

    // Quick Add Supplier
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierPhone, setNewSupplierPhone] = useState("");
    const [isAddingSupplier, setIsAddingSupplier] = useState(false);

    const handleAddSupplier = async () => {
        if (!newSupplierName.trim()) return;
        setIsAddingSupplier(true);
        try {
            const res = await fetchWithAuth('/api/ledger/suppliers/', {
                method: 'POST',
                body: JSON.stringify({
                    name: newSupplierName,
                    phone: newSupplierPhone
                })
            });
            if (res.ok) {
                const newSupplier = await res.json();
                setSuppliers([...suppliers, newSupplier]);
                setSupplierId(newSupplier.id.toString());
                setNewSupplierName("");
                setNewSupplierPhone("");
                setShowAddSupplier(false);
            }
        } catch (err) {
            console.error("Failed to add supplier", err);
        } finally {
            setIsAddingSupplier(false);
        }
    };

    // Journal Items
    const [items, setItems] = useState<JournalItem[]>([
        { ledger: 0, debit_amount: 0, credit_amount: 0, particulars: "" },
        { ledger: 0, debit_amount: 0, credit_amount: 0, particulars: "" },
    ]);

    useEffect(() => {
        async function fetchMasters() {
            try {
                const [ledgersRes, suppliersRes, membersRes] = await Promise.all([
                    fetchWithAuth('/api/ledger/accounts/?flat=1'),
                    fetchWithAuth('/api/ledger/suppliers/'),
                    fetchWithAuth('/api/jamath/members/')
                ]);

                if (ledgersRes.ok) setLedgers(await ledgersRes.json());
                if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
                if (membersRes.ok) setMembers(await membersRes.json());
            } catch (err) {
                console.error("Failed to fetch masters", err);
            }
        }
        fetchMasters();
    }, []);

    const totalDebit = items.reduce((sum, i) => sum + (i.debit_amount || 0), 0);
    const totalCredit = items.reduce((sum, i) => sum + (i.credit_amount || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const addItem = () => {
        setItems([...items, { ledger: 0, debit_amount: 0, credit_amount: 0, particulars: "" }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 2) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof JournalItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!isBalanced) {
            setError("Debits must equal Credits");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const payload: any = {
                voucher_type: voucherType,
                date,
                narration,
                payment_mode: paymentMode,
                items: items.filter(i => i.ledger > 0).map(i => ({
                    ledger: i.ledger,
                    debit_amount: i.debit_amount.toString(),
                    credit_amount: i.credit_amount.toString(),
                    particulars: i.particulars
                }))
            };

            if (voucherType === 'RECEIPT') {
                if (donorId) payload.donor = parseInt(donorId);
                payload.donor_name_manual = donorNameManual;
                payload.donor_pan = donorPan;
                payload.donor_intent = donorIntent;
            }

            if (voucherType === 'PAYMENT') {
                if (supplierId) payload.supplier = parseInt(supplierId);
                payload.vendor_invoice_no = vendorInvoiceNo;
                if (vendorInvoiceDate) payload.vendor_invoice_date = vendorInvoiceDate;
            }

            const res = await fetchWithAuth('/api/ledger/journal-entries/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/dashboard/finance');
            } else {
                const data = await res.json();
                setError(typeof data === 'string' ? data : JSON.stringify(data));
            }
        } catch (err: any) {
            setError(err.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLedgersByType = (types: string[]) => {
        return ledgers.filter(l => types.includes(l.account_type));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">New Voucher Entry</h1>
                    <p className="text-gray-500 text-sm">Record a financial transaction</p>
                </div>
            </div>

            {/* Voucher Type Tabs */}
            <Tabs value={voucherType} onValueChange={setVoucherType}>
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="RECEIPT" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                        Receipt
                    </TabsTrigger>
                    <TabsTrigger value="PAYMENT" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                        Payment
                    </TabsTrigger>
                    <TabsTrigger value="JOURNAL" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                        Journal
                    </TabsTrigger>
                </TabsList>

                {/* Common Fields */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Mode</Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="NEFT">Bank Transfer (NEFT/IMPS)</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <Label>Narration / Description</Label>
                            <Textarea
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                placeholder="Brief description of the transaction"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Receipt-specific fields */}
                <TabsContent value="RECEIPT">
                    <Card>
                        <CardHeader>
                            <CardTitle>Donor Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Select Member (optional)</Label>
                                <Select value={donorId || "__NONE__"} onValueChange={(v) => setDonorId(v === "__NONE__" ? "" : v)}>
                                    <SelectTrigger><SelectValue placeholder="Search member..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__NONE__">-- Guest Donor --</SelectItem>
                                        {members.map(m => (
                                            <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Guest Donor Name</Label>
                                <Input
                                    value={donorNameManual}
                                    onChange={(e) => setDonorNameManual(e.target.value)}
                                    placeholder="For non-member donors"
                                    disabled={!!donorId}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>PAN Number <span className="text-xs text-gray-500">(Required if &gt; ₹2000)</span></Label>
                                <Input
                                    value={donorPan}
                                    onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Specific Direction (optional)</Label>
                                <Input
                                    value={donorIntent}
                                    onChange={(e) => setDonorIntent(e.target.value)}
                                    placeholder="e.g., For buying fans only"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fund Category <span className="text-red-500">*</span></Label>
                                <Select value={fundCategory} onValueChange={setFundCategory}>
                                    <SelectTrigger><SelectValue placeholder="Select Fund Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__ALL__">-- All Funds --</SelectItem>
                                        {FUND_CATEGORIES.map(fc => (
                                            <SelectItem key={fc.value} value={fc.value}>{fc.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">Filters the account list below</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment-specific fields */}
                <TabsContent value="PAYMENT">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Vendor Information</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddSupplier(!showAddSupplier)}
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Supplier
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Quick Add Supplier Form */}
                            {showAddSupplier && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                                    <p className="font-medium text-blue-800">Quick Add Supplier</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-sm">Name *</Label>
                                            <Input
                                                value={newSupplierName}
                                                onChange={(e) => setNewSupplierName(e.target.value)}
                                                placeholder="Supplier/Vendor Name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm">Phone</Label>
                                            <Input
                                                value={newSupplierPhone}
                                                onChange={(e) => setNewSupplierPhone(e.target.value)}
                                                placeholder="Contact Number"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={handleAddSupplier}
                                                disabled={!newSupplierName.trim() || isAddingSupplier}
                                                className="w-full"
                                            >
                                                {isAddingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add & Select"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Existing Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <Select value={supplierId || "__NONE__"} onValueChange={(v) => setSupplierId(v === "__NONE__" ? "" : v)}>
                                        <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__NONE__">-- Select Supplier --</SelectItem>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Invoice Number</Label>
                                    <Input
                                        value={vendorInvoiceNo}
                                        onChange={(e) => setVendorInvoiceNo(e.target.value)}
                                        placeholder="Vendor invoice #"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Invoice Date</Label>
                                    <Input
                                        type="date"
                                        value={vendorInvoiceDate}
                                        onChange={(e) => setVendorInvoiceDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Journal Items */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Ledger Entries</CardTitle>
                        <CardDescription>Debit and Credit accounts</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Line
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Header - Hidden on Mobile */}
                        <div className="hidden md:grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 px-2">
                            <div className="col-span-5">Account</div>
                            <div className="col-span-2 text-right">Debit (₹)</div>
                            <div className="col-span-2 text-right">Credit (₹)</div>
                            <div className="col-span-2">Particulars</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* Items */}
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-2 p-4 md:p-0 border md:border-0 rounded-lg bg-gray-50 md:bg-transparent">
                                <div className="md:col-span-5">
                                    <Label className="md:hidden text-xs text-gray-500 mb-1 block">Account</Label>
                                    <Select
                                        value={item.ledger.toString()}
                                        onValueChange={(v) => updateItem(index, 'ledger', parseInt(v))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                                        <SelectContent>
                                            {ledgers
                                                .filter(l => !fundCategory || fundCategory === '__ALL__' || l.fund_type === fundCategory)
                                                .map(l => (
                                                    <SelectItem key={l.id} value={l.id.toString()}>
                                                        {l.code} - {l.name}
                                                        {l.fund_type && <Badge className="ml-2 text-xs" variant="outline">{l.fund_type}</Badge>}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Debit/Credit Group for Mobile */}
                                <div className="grid grid-cols-2 gap-3 md:contents">
                                    <div className="md:col-span-2">
                                        <Label className="md:hidden text-xs text-gray-500 mb-1 block">Debit</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.debit_amount || ''}
                                            onChange={(e) => updateItem(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                                            className="text-right"
                                            placeholder="Dr"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="md:hidden text-xs text-gray-500 mb-1 block">Credit</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.credit_amount || ''}
                                            onChange={(e) => updateItem(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                                            className="text-right"
                                            placeholder="Cr"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <Label className="md:hidden text-xs text-gray-500 mb-1 block">Particulars</Label>
                                    <Input
                                        value={item.particulars}
                                        onChange={(e) => updateItem(index, 'particulars', e.target.value)}
                                        placeholder="Note"
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end md:block">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length <= 2}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Totals */}
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-2 border-t pt-4 font-bold items-center">
                            <div className="md:col-span-5 text-left md:text-right">Total:</div>
                            <div className={`md:col-span-2 text-right ${totalDebit !== totalCredit ? 'text-red-500' : 'text-green-600'}`}>
                                ₹{totalDebit.toLocaleString('en-IN')}
                            </div>
                            <div className={`md:col-span-2 text-right ${totalDebit !== totalCredit ? 'text-red-500' : 'text-green-600'}`}>
                                <span className="md:hidden mr-2 text-gray-400 font-normal">/</span>
                                ₹{totalCredit.toLocaleString('en-IN')}
                            </div>
                            <div className="col-span-2 md:col-span-3 text-right md:text-left mt-2 md:mt-0">
                                {isBalanced ? (
                                    <Badge className="bg-green-100 text-green-700">✓ Balanced</Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-700">⚠ Unbalanced</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                    <Link href="/dashboard/finance">Cancel</Link>
                </Button>
                <Button onClick={handleSubmit} disabled={!isBalanced || isSubmitting}>
                    {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                        <><Save className="h-4 w-4 mr-2" /> Save Voucher</>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default function VoucherEntryPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
            <VoucherFormContent />
        </Suspense>
    );
}
