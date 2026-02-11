import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Loader2, Wallet, Building2, TrendingUp, TrendingDown, Scale, ChevronRight, X, Trash2 } from "lucide-react";
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Ledger = {
    id: number;
    code: string;
    name: string;
    account_type: string;
    fund_type: string | null;
    balance: string;
    children: Ledger[];
    parent?: number | null;
    is_system: boolean;
};

const accountTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
    'ASSET': { icon: Wallet, color: 'bg-blue-100 text-blue-700', label: 'Assets' },
    'LIABILITY': { icon: Building2, color: 'bg-orange-100 text-orange-700', label: 'Liabilities' },
    'INCOME': { icon: TrendingUp, color: 'bg-green-100 text-green-700', label: 'Income' },
    'EXPENSE': { icon: TrendingDown, color: 'bg-red-100 text-red-700', label: 'Expenses' },
    'EQUITY': { icon: Scale, color: 'bg-purple-100 text-purple-700', label: 'Equity/Corpus' },
};

const fundTypeOptions = [
    { value: 'GENERAL', label: 'General (Unrestricted)' },
    { value: 'ZAKAT', label: '🟢 Zakat (Restricted)' },
];

export function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Ledger[]>([]);
    const [flatAccounts, setFlatAccounts] = useState<Ledger[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    // Add Account Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [newAccountType, setNewAccountType] = useState("INCOME");
    const [newFundType, setNewFundType] = useState("GENERAL"); // Compulsory Default
    const [newParentId, setNewParentId] = useState("__NONE__");
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const fetchAccounts = async () => {
        try {
            const [hierarchicalRes, flatRes] = await Promise.all([
                fetchWithAuth('/api/ledger/accounts/'),
                fetchWithAuth('/api/ledger/accounts/?flat=1')
            ]);

            if (hierarchicalRes.ok) {
                const data = await hierarchicalRes.json();
                setAccounts(data);
                const ids = new Set<number>();
                const collectIds = (nodes: Ledger[]) => {
                    nodes.forEach(n => {
                        if (n.children && n.children.length > 0) ids.add(n.id);
                        if (n.children) collectIds(n.children);
                    });
                };
                collectIds(data);
                setExpandedGroups(ids);
            }

            if (flatRes.ok) {
                setFlatAccounts(await flatRes.json());
            }
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const toggleGroup = (id: number) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedGroups(newSet);
    };

    const handleAddAccount = async () => {
        if (!newCode.trim() || !newName.trim()) {
            setAddError("Code and Name are required");
            return;
        }

        setIsAdding(true);
        setAddError("");

        try {
            const payload: any = {
                code: newCode,
                name: newName,
                account_type: newAccountType,
                fund_type: newFundType, // Compulsory send
            };

            if (newParentId !== "__NONE__") {
                payload.parent = parseInt(newParentId);
            } else {
                payload.parent = null;
            }

            const res = await fetchWithAuth('/api/ledger/accounts/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setNewName("");
                setNewCode("");
                setNewAccountType("INCOME");
                setNewFundType("GENERAL");
                setNewParentId("__NONE__");
                setShowAddForm(false);
                fetchAccounts();
            } else {
                const data = await res.json();
                setAddError(typeof data === 'string' ? data : JSON.stringify(data));
            }
        } catch (err: any) {
            setAddError(err.message || "Failed to add account");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteAccount = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete account "${name}"?`)) return;

        setIsAdding(true);
        try {
            const res = await fetchWithAuth(`/api/ledger/accounts/${id}/`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchAccounts();
            } else {
                const data = await res.json();
                // Simple Alert for now, or could use toast
                alert(typeof data === 'string' ? data : (data.detail || "Failed to delete account. It may have transactions."));
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting account");
        } finally {
            setIsAdding(false);
        }
    };

    const renderAccount = (account: Ledger, level: number = 0) => {
        const visibleChildren = account.children?.filter(c => c.account_type === account.account_type) || [];
        const hasChildren = visibleChildren.length > 0;

        const isExpanded = expandedGroups.has(account.id);
        const config = accountTypeConfig[account.account_type] || accountTypeConfig['ASSET'];
        const Icon = config.icon;

        // Delete condition: Balance is 0 AND not a system account
        const isZeroBalance = parseFloat(account.balance) === 0;
        const canDelete = isZeroBalance && !account.is_system;

        return (
            <div key={account.id}>
                <div
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}
                    onClick={() => hasChildren && toggleGroup(account.id)}
                >
                    <div className="flex items-center gap-3">
                        {hasChildren && (
                            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                        {!hasChildren && <div className="w-4" />}
                        <div className={`p-1.5 rounded ${config.color}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="font-mono text-sm text-gray-500 mr-2">{account.code}</span>
                            <span className="font-medium">{account.name}</span>
                            {/* Show Linked Parent (Mother Asset) */}
                            {account.parent && (
                                (() => {
                                    const parent = flatAccounts.find(p => p.id === account.parent);
                                    return parent ? (
                                        <Badge variant="secondary" className="ml-2 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200" title={`Linked Asset: ${parent.name}`}>
                                            🏦 {parent.code}
                                        </Badge>
                                    ) : null;
                                })()
                            )}
                            {account.fund_type && (
                                <Badge variant="outline" className="ml-2 text-xs">{account.fund_type}</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${parseFloat(account.balance) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            ₹{parseFloat(account.balance || '0').toLocaleString('en-IN')}
                        </span>
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteAccount(e, account.id, account.name)}
                                title="Delete Account"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-2">
                        {visibleChildren.map(child => renderAccount(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const findNodeRecursive = (nodes: Ledger[], id: number): Ledger | undefined => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeRecursive(node.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const getSectorRoots = (type: string) => {
        const rootIds = flatAccounts.filter(a => {
            if (a.account_type !== type) return false;
            if (!a.parent) return true;
            const parent = flatAccounts.find(p => p.id === a.parent);
            return parent && parent.account_type !== type; // If parent is diff type, this is a root of this sector
        }).map(a => a.id);

        return rootIds.map(id => findNodeRecursive(accounts, id)).filter((n): n is Ledger => !!n);
    };

    const groupedAccounts = {
        ASSET: getSectorRoots('ASSET'),
        LIABILITY: getSectorRoots('LIABILITY'),
        INCOME: getSectorRoots('INCOME'),
        EXPENSE: getSectorRoots('EXPENSE'),
        EQUITY: getSectorRoots('EQUITY'),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/dashboard/finance"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Chart of Accounts</h1>
                    <p className="text-gray-500 text-sm">Ledger structure for double-entry accounting</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Account
                </Button>
            </div>

            {/* Add Account Form */}
            {showAddForm && (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">Create New Account</CardTitle>
                            <CardDescription>Add a new fund or ledger account</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Account Code *</Label>
                                <Input
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    placeholder="e.g., 3010"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Name *</Label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Kabrastan Cleanup Fund"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Type</Label>
                                <Select value={newAccountType} onValueChange={setNewAccountType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">📈 Income</SelectItem>
                                        <SelectItem value="EXPENSE">📉 Expense</SelectItem>
                                        <SelectItem value="ASSET">💰 Asset</SelectItem>
                                        <SelectItem value="LIABILITY">🏦 Liability</SelectItem>
                                        <SelectItem value="EQUITY">📊 Equity/Corpus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fund Type (Restriction)</Label>
                                <Select value={newFundType} onValueChange={setNewFundType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {fundTypeOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Parent Account (optional)</Label>
                                <Select value={newParentId} onValueChange={setNewParentId}>
                                    <SelectTrigger><SelectValue placeholder="Select parent..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__NONE__">-- No Parent (Top Level) --</SelectItem>
                                        {flatAccounts.filter(a => !a.code.includes('.')).map(a => (
                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                {a.code} - {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleAddAccount}
                                    disabled={!newCode.trim() || !newName.trim() || isAdding}
                                    className="w-full"
                                >
                                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Create Account
                                </Button>
                            </div>
                        </div>

                        {addError && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{addError}</p>
                        )}

                        <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                            💡 <strong>Tip:</strong> For a new fund like "Kabrastan Cleanup":
                            <ul className="list-disc list-inside ml-4 mt-1">
                                <li>Create an <strong>Income</strong> account (e.g., 3010 - Kabrastan Cleanup Donation)</li>
                                <li>Create a matching <strong>Expense</strong> account (e.g., 4011 - Kabrastan Cleanup Expense)</li>
                                <li>Optionally mark them as <strong>Restricted</strong> to prevent mixing with general funds</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Account Groups */}
            {Object.entries(groupedAccounts).map(([type, accs]) => {
                if (accs.length === 0) return null;
                const config = accountTypeConfig[type];
                const Icon = config.icon;

                return (
                    <Card key={type}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${config.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                {config.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {accs.map(account => renderAccount(account))}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
