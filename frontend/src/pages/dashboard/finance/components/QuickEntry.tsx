import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, ArrowRight, Check, Plus, Receipt, CreditCard, FileText } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";

export function QuickEntry() {
    const [text, setText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [parsed, setParsed] = useState<any>(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleProcess = async () => {
        if (!text.trim()) return;
        setIsProcessing(true);
        setError("");
        setParsed(null);

        try {
            const res = await fetchWithAuth('/api/basira/simple-entry/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setParsed(data.parsed);
            } else {
                setError(data.error || "Failed to process entry. Please try again.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!parsed) return;
        setIsSaving(true);
        setError("");

        try {
            navigate(`/dashboard/finance/voucher?type=${parsed.voucher_type}`, {
                state: {
                    prefill: {
                        amount: parsed.amount,
                        narration: parsed.narration,
                        ledger_id: parsed.ledger_id,
                        party_name: parsed.donor_or_vendor,
                        account_name: parsed.account_name,
                        payment_mode: 'CASH'
                    }
                }
            });
        } catch (err) {
            setError("Failed to process. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Plus className="h-5 w-5 text-gray-600" />
                    Add New Entry
                </CardTitle>
                <CardDescription className="text-xs">
                    Use AI to describe naturally, or manually create a voucher
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Manual Entry Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="flex-1 min-w-[120px] border-green-200 hover:bg-green-50 hover:border-green-300" asChild>
                        <Link to="/dashboard/finance/voucher?type=RECEIPT">
                            <Receipt className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-green-700">Receipt</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 min-w-[120px] border-red-200 hover:bg-red-50 hover:border-red-300" asChild>
                        <Link to="/dashboard/finance/voucher?type=PAYMENT">
                            <CreditCard className="h-4 w-4 mr-2 text-red-600" />
                            <span className="text-red-700">Payment</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 min-w-[120px] border-blue-200 hover:bg-blue-50 hover:border-blue-300" asChild>
                        <Link to="/dashboard/finance/voucher?type=JOURNAL">
                            <FileText className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-blue-700">Journal</span>
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Separator className="flex-1" />
                    <span>OR use AI</span>
                    <Separator className="flex-1" />
                </div>

                {/* AI Quick Entry */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">Basira AI Quick Entry</span>
                    </div>

                    {!parsed ? (
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Describe naturally... e.g. 'Chanda by Rahman 500' or 'Paid electrician 1200'"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[60px] bg-white border-indigo-200 focus-visible:ring-indigo-500 resize-none text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleProcess();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleProcess}
                                disabled={isProcessing || !text.trim()}
                                className="h-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-4"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${parsed.voucher_type === 'RECEIPT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {parsed.voucher_type}
                                        </span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {parsed.confidence === 'high' ? 'High Confidence' : 'Low Confidence'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg">{parsed.account_name}</h3>
                                    <div className="text-gray-600 text-sm mt-1">{parsed.narration}</div>
                                    {parsed.donor_or_vendor && (
                                        <div className="text-gray-500 text-xs mt-1">
                                            Party: <span className="font-medium">{parsed.donor_or_vendor}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-bold ${parsed.voucher_type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{parsed.amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    Verify & Continue
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setParsed(null)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-medium mt-3">
                            {error}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
