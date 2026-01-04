import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ArrowRight, Check } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useNavigate } from "react-router-dom";

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
            // Navigate to voucher form with prefilled data
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
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100 mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Basira Quick Entry (AI)
                </CardTitle>
                <CardDescription className="text-xs text-indigo-600/80">
                    Describe transaction naturally (e.g., "Chanda by Rahman 500")
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {!parsed ? (
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Type here... e.g 'Paid electrician 1200', 'Zakat from Ahmed 5000'"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[80px] bg-white border-indigo-200 focus-visible:ring-indigo-500 resize-none"
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
                                className="h-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
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
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-medium">
                            {error}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
