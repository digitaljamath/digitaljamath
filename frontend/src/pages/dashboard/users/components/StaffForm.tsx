import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Copy, CheckCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type StaffFormProps = {
    staff?: any;
    onSuccess: () => void;
    onCancel: () => void;
};

type Role = {
    id: number;
    name: string;
};

type SearchResult = {
    type: 'member' | 'user';
    id: number;
    name: string;
    detail: string;
    has_login: boolean;
};

export function StaffForm({ staff, onSuccess, onCancel }: StaffFormProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>(staff ? String(staff.role) : "");
    const [designation, setDesignation] = useState(staff?.designation || "");
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<SearchResult | null>(null);

    // Credentials modal
    const [showCredentials, setShowCredentials] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string, password: string } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const rolesRes = await fetchWithAuth('/api/jamath/staff-roles/');
                const rolesData = await rolesRes.json();
                setRoles(rolesData);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingData(false);
            }
        }
        fetchData();
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery || staff) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetchWithAuth(`/api/jamath/staff-lookup/?q=${searchQuery}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, staff]);

    const handleSelectCandidate = (candidate: SearchResult) => {
        setSelectedCandidate(candidate);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const url = staff
                ? `/api/jamath/staff-members/${staff.id}/`
                : '/api/jamath/staff-members/';

            const method = staff ? 'PUT' : 'POST';

            const payload: any = {
                role: selectedRoleId,
                designation,
            };

            if (!staff && selectedCandidate) {
                if (selectedCandidate.type === 'member') {
                    payload.member_id = selectedCandidate.id;
                } else {
                    payload.user_id = selectedCandidate.id;
                }
            }

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();

                // Check if credentials were generated
                if (data.generated_credentials) {
                    setGeneratedCredentials(data.generated_credentials);
                    setShowCredentials(true);
                } else {
                    onSuccess();
                }
            } else {
                const data = await res.json();
                setError(JSON.stringify(data));
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyCredentials = () => {
        if (generatedCredentials) {
            const text = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCredentialsClose = () => {
        setShowCredentials(false);
        onSuccess();
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {!staff && (
                    <div className="space-y-2">
                        <Label>Select Family Head</Label>
                        {!selectedCandidate ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {(searchResults.length > 0 || isSearching) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {isSearching && <div className="p-2 text-xs text-gray-500">Searching...</div>}
                                        {searchResults.map((result) => (
                                            <div
                                                key={`${result.type}-${result.id}`}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                                                onClick={() => handleSelectCandidate(result)}
                                            >
                                                <div className="font-medium">{result.name}</div>
                                                <div className="text-xs text-gray-500">{result.detail}</div>
                                                {result.type === 'member' && (
                                                    <div className="text-xs text-blue-600 mt-1">
                                                        {result.has_login ? '✓ Has Login' : '⚠ Will create login'}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-md bg-blue-50 border-blue-100">
                                <div>
                                    <div className="text-sm font-medium text-blue-900">{selectedCandidate.name}</div>
                                    <div className="text-xs text-blue-700">{selectedCandidate.detail}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)}>
                                    Change
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="designation">Designation / Title</Label>
                    <Input
                        id="designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Treasurer"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    {isLoadingData ? (
                        <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                    ) : (
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {error && (
                    <div className="text-sm text-red-500 font-medium break-words">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || (!staff && !selectedCandidate)}>
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {staff ? "Update Assignment" : "Assign Role"}
                    </Button>
                </div>
            </form>

            {/* Credentials Modal */}
            <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Staff Login Credentials Generated</DialogTitle>
                        <DialogDescription>
                            A new login has been created for this staff member. Please copy and securely share these credentials.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="p-4 bg-gray-50 rounded-md space-y-2">
                            <div>
                                <div className="text-xs text-gray-500">Username</div>
                                <div className="font-mono font-semibold">{generatedCredentials?.username}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Temporary Password</div>
                                <div className="font-mono font-semibold">{generatedCredentials?.password}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCopyCredentials} className="flex-1">
                                {copied ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Credentials
                                    </>
                                )}
                            </Button>
                            <Button onClick={handleCredentialsClose} variant="outline">
                                Done
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            ⚠️ This password will not be shown again. The staff member should change it after first login.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
