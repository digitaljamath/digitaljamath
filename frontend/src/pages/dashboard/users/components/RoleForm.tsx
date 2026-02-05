import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

type RoleFormProps = {
    role?: any; // If provided, edit mode
    onSuccess: () => void;
    onCancel: () => void;
};

const MODULES = [
    { id: 'jamath', label: 'Jamath (Core)', description: 'Access to Households & Members' },
    { id: 'finance', label: 'Finance', description: 'Ledgers, Accounting, Vouchers' },
    { id: 'welfare', label: 'Welfare', description: 'Service Requests, Schemes' },
    { id: 'announcements', label: 'Announcements', description: 'Manage Announcements' },
    { id: 'reports', label: 'Reports', description: 'View System Reports' },
    { id: 'users', label: 'Staff Access', description: 'Manage Staff & Roles' },
    { id: 'settings', label: 'Settings', description: 'System Configuration' },
];

const ACCESS_LEVELS = [
    { value: '', label: 'No Access' },
    { value: 'read', label: 'Read Only' },
    { value: 'admin', label: 'Full Admin' },
];

export function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
    const [name, setName] = useState(role?.name || "");
    const [description, setDescription] = useState(role?.description || "");
    const [permissions, setPermissions] = useState<Record<string, string>>(role?.permissions || {});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handlePermissionChange = (moduleId: string, level: string) => {
        setPermissions(prev => {
            const next = { ...prev };
            if (!level) {
                delete next[moduleId];
            } else {
                next[moduleId] = level;
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const url = role
                ? `/api/jamath/staff-roles/${role.id}/`
                : '/api/jamath/staff-roles/';

            const method = role ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({
                    name,
                    description,
                    permissions
                })
            });

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                console.error("Role save failed:", data);
                // Handle DRF standard error 'detail' or custom 'error'
                let errorMessage = data.detail || data.error || "Failed to save role";

                // transform object errors (validation errors) into string
                if (!data.detail && !data.error && typeof data === 'object') {
                    const firstKey = Object.keys(data)[0];
                    if (firstKey) {
                        const firstError = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
                        errorMessage = `${firstKey}: ${firstError}`;
                    }
                }

                setError(errorMessage);
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Finance Manager"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the responsibilities..."
                />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-medium mb-4">Module Permissions</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {MODULES.map(module => (
                        <div key={module.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                            <div className="md:col-span-2">
                                <span className="font-medium text-sm block">{module.label}</span>
                                <span className="text-xs text-gray-500">{module.description}</span>
                            </div>
                            <div>
                                <Select
                                    value={permissions[module.id] || ''}
                                    onValueChange={(val) => handlePermissionChange(module.id, val)}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="No Access" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACCESS_LEVELS.map(level => (
                                            <SelectItem key={level.value} value={level.value || 'none'}>
                                                {level.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-500 font-medium">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {role ? "Update Role" : "Create Role"}
                </Button>
            </div>
        </form>
    );
}
