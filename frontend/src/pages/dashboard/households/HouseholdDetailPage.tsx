import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit2, Loader2, MapPin, Phone, Plus, Trash2, User, Users, Send, CheckCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type Member = {
    id: number;
    full_name: string;
    is_head_of_family: boolean;
    relationship_to_head: string;
    gender: "MALE" | "FEMALE";
    dob?: string;
    age?: number;
    marital_status: string;
    profession?: string;
    education?: string;
    skills?: string;
    is_employed?: boolean;
    monthly_income?: string;
    is_alive: boolean;
};

type Household = {
    id: number;
    membership_id: string;
    address: string;
    phone_number: string;
    economic_status: string;
    housing_status: string;
    is_verified: boolean;
    members: Member[];
    member_count: number;
    head_name: string;
    is_membership_active: boolean;
};

export function HouseholdDetailPage() {
    const { id } = useParams();
    const { toast } = useToast();
    const [household, setHousehold] = useState<Household | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMemberLoading, setIsMemberLoading] = useState(false);

    // Member Form State
    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [memberForm, setMemberForm] = useState({
        full_name: "",
        relationship_to_head: "SON",
        gender: "MALE",
        dob: "",
        marital_status: "SINGLE",
        profession: "",
        education: "",
        skills: "",
        is_employed: false,
        monthly_income: "",
        is_head_of_family: false
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`/api/jamath/households/${id}/`);
            if (!res.ok) throw new Error("Failed to load household");
            const data = await res.json();
            setHousehold(data);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load details" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!household) return;
        setIsMemberLoading(true);

        try {
            const url = editingMember
                ? `/api/jamath/members/${editingMember.id}/`
                : "/api/jamath/members/";
            const method = editingMember ? "PUT" : "POST";

            const payload = {
                ...memberForm,
                household: household.id,
                // Ensure correct types for optional fields
                dob: memberForm.dob || null,
                monthly_income: memberForm.monthly_income ? memberForm.monthly_income : null,
                is_alive: true,
                is_approved: true
            };

            const res = await fetchWithAuth(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err);
            }

            toast({ title: "Success", description: "Member saved successfully" });
            setIsMemberDialogOpen(false);
            loadData(); // Reload to get updated list
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save member" });
        } finally {
            setIsMemberLoading(false);
        }
    };

    const handleDeleteMember = async (memberId: number) => {
        try {
            const res = await fetchWithAuth(`/api/jamath/members/${memberId}/`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast({ title: "Deleted", description: "Member removed" });
            loadData();
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not delete member" });
        }
    };

    const openNewMemberDialog = () => {
        setEditingMember(null);
        setMemberForm({
            full_name: "",
            relationship_to_head: "SON",
            gender: "MALE",
            dob: "",
            marital_status: "SINGLE",
            profession: "",
            education: "",
            skills: "",
            is_employed: false,
            monthly_income: "",
            is_head_of_family: household?.members?.length === 0 // Auto-set head if first member
        });
        setIsMemberDialogOpen(true);
    };

    const openEditMemberDialog = (m: Member) => {
        setEditingMember(m);
        setMemberForm({
            full_name: m.full_name,
            relationship_to_head: m.relationship_to_head,
            gender: m.gender,
            dob: m.dob || "",
            marital_status: m.marital_status,
            profession: m.profession || "",
            education: m.education || "",
            skills: m.skills || "",
            is_employed: m.is_employed || false,
            monthly_income: m.monthly_income ? String(m.monthly_income) : "",
            is_head_of_family: m.is_head_of_family
        });
        setIsMemberDialogOpen(true);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!household) return <div className="p-8 text-center text-red-500">Household not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/dashboard/households">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Household #{household.membership_id}</h1>
                            {household.is_verified && <Badge variant="secondary">Verified</Badge>}
                        </div>
                        <p className="text-sm text-gray-500">{household.head_name} & Family</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!household.is_membership_active && (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                                if (!confirm("Activate membership for this household? This will record a manual payment.")) return;
                                const res = await fetchWithAuth(`/api/jamath/households/${id}/activate_subscription/`, { method: 'POST' });
                                if (res.ok) {
                                    toast({ title: 'Membership Activated' });
                                    window.location.reload();
                                } else {
                                    toast({ title: 'Failed', variant: 'destructive' });
                                }
                            }}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Activate Membership
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={async () => {
                            const res = await fetchWithAuth(`/api/telegram/remind/${id}/`, { method: 'POST', body: JSON.stringify({}) });
                            if (res.ok) {
                                toast({ title: 'Reminder sent via Telegram' });
                            } else {
                                const data = await res.json();
                                toast({ title: 'Failed', description: data.error, variant: 'destructive' });
                            }
                        }}
                    >
                        <Send className="h-4 w-4 mr-2" /> Send Reminder
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to={`/dashboard/households/${id}/edit`}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                        </Link>
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            if (window.confirm("CRITICAL: Are you sure you want to delete this ENTIRE household? This action cannot be undone and will delete all members and data.")) {
                                try {
                                    const res = await fetchWithAuth(`/api/jamath/households/${id}/`, { method: 'DELETE' });
                                    if (res.ok) {
                                        toast({ title: 'Household Deleted', description: 'Redirecting...' });
                                        // Wait a moment before redirect
                                        setTimeout(() => window.location.href = "/dashboard/households", 1000);
                                    } else {
                                        const err = await res.text();
                                        toast({ variant: 'destructive', title: 'Delete Failed', description: err || "Unknown error" });
                                    }
                                } catch (e) {
                                    toast({ variant: 'destructive', title: 'Error', description: "Network error" });
                                }
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Household
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Household Info Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Address</p>
                                <p className="text-sm">{household.address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Contact</p>
                                <p className="text-sm">{household.phone_number || "No phone linked"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Status</p>
                                <p className="font-medium text-sm">{household.economic_status}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Housing</p>
                                <p className="font-medium text-sm">{household.housing_status}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Members</p>
                                <p className="font-medium text-sm">{household.member_count}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members List */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Family Members</CardTitle>
                            <CardDescription>Manage members in this household</CardDescription>
                        </div>
                        <Button size="sm" onClick={openNewMemberDialog}>
                            <Plus className="h-4 w-4 mr-2" /> Add Member
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Relation</TableHead>
                                        <TableHead>Age/Gender</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {household.members?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                No members added yet. Add the head of family first.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        household.members?.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    {member.full_name}
                                                    {member.is_head_of_family && (
                                                        <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 text-[10px] px-1.5 py-0">Head</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm capitalize">{member.relationship_to_head.toLowerCase()}</TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {member.age ? `${member.age} yrs` : 'N/A'} • {member.gender === 'MALE' ? 'M' : 'F'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMemberDialog(member)}>
                                                            <Edit2 className="h-4 w-4 text-gray-500" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to delete ${member.full_name}?`)) {
                                                                    handleDeleteMember(member.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Member Dialog */}
            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingMember ? "Edit Member" : "Add Family Member"}</DialogTitle>
                        <DialogDescription>
                            {household.members?.length === 0 && !editingMember ? "This first member will be set as Head of Family." : "Enter member details below."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveMember} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" required value={memberForm.full_name} onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Gender</Label>
                                <Select value={memberForm.gender} onValueChange={(val: any) => setMemberForm({ ...memberForm, gender: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date of Birth</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={memberForm.dob ? memberForm.dob.split('-')[2] : ''}
                                        onChange={(e) => {
                                            const day = e.target.value;
                                            const current = memberForm.dob ? memberForm.dob.split('-') : ['', '', ''];
                                            const month = current[1] || '01';
                                            const year = current[0] || '2000';
                                            if (day) setMemberForm({ ...memberForm, dob: `${year}-${month}-${day}` });
                                        }}
                                    >
                                        <option value="">Day</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                            <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={memberForm.dob ? memberForm.dob.split('-')[1] : ''}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            const current = memberForm.dob ? memberForm.dob.split('-') : ['', '', ''];
                                            const day = current[2] || '01';
                                            const year = current[0] || '2000';
                                            if (month) setMemberForm({ ...memberForm, dob: `${year}-${month}-${day}` });
                                        }}
                                    >
                                        <option value="">Month</option>
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                            <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={memberForm.dob ? memberForm.dob.split('-')[0] : ''}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            const current = memberForm.dob ? memberForm.dob.split('-') : ['', '', ''];
                                            const day = current[2] || '01';
                                            const month = current[1] || '01';
                                            if (year) setMemberForm({ ...memberForm, dob: `${year}-${month}-${day}` });
                                        }}
                                    >
                                        <option value="">Year</option>
                                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Relation to Head</Label>
                                <Select
                                    value={memberForm.relationship_to_head}
                                    onValueChange={(val: string) => {
                                        let marital = memberForm.marital_status;
                                        if (val === 'SPOUSE') marital = 'MARRIED';
                                        if (val === 'SON' || val === 'DAUGHTER') marital = 'SINGLE';
                                        if (val === 'FATHER' || val === 'MOTHER') marital = 'MARRIED';

                                        setMemberForm({
                                            ...memberForm,
                                            relationship_to_head: val,
                                            marital_status: marital
                                        });
                                    }}
                                    disabled={memberForm.is_head_of_family}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SELF">Self (Head)</SelectItem>
                                        <SelectItem value="SPOUSE">Spouse</SelectItem>
                                        <SelectItem value="SON">Son</SelectItem>
                                        <SelectItem value="DAUGHTER">Daughter</SelectItem>
                                        <SelectItem value="FATHER">Father</SelectItem>
                                        <SelectItem value="MOTHER">Mother</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Marital Status</Label>
                                <Select
                                    value={memberForm.marital_status}
                                    onValueChange={(val: string) => setMemberForm({ ...memberForm, marital_status: val })}
                                // Removed disabled prop to allow corrections (e.g. Widowed Spouse)
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SINGLE">Single</SelectItem>
                                        <SelectItem value="MARRIED">Married</SelectItem>
                                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Education & Profession */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="education">Education</Label>
                                <Input
                                    id="education"
                                    placeholder="e.g. Graduate"
                                    value={memberForm.education}
                                    onChange={e => setMemberForm({ ...memberForm, education: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profession">Profession/Job</Label>
                                <Input
                                    id="profession"
                                    placeholder="e.g. Driver"
                                    value={memberForm.profession}
                                    onChange={e => setMemberForm({ ...memberForm, profession: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Skills & Income */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="skills">Skills</Label>
                                <Input
                                    id="skills"
                                    placeholder="e.g. Tailoring, Cooking"
                                    value={memberForm.skills}
                                    onChange={e => setMemberForm({ ...memberForm, skills: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="income">Monthly Income</Label>
                                <Input
                                    id="income"
                                    type="number"
                                    placeholder="0 if unemployed"
                                    value={memberForm.monthly_income}
                                    onChange={e => setMemberForm({ ...memberForm, monthly_income: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Employment Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_employed"
                                checked={memberForm.is_employed}
                                onChange={e => setMemberForm({ ...memberForm, is_employed: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_employed" className="font-normal">Currently Employed?</Label>
                        </div>

                        {/* Head of Family Toggle */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <input
                                type="checkbox"
                                id="is_head"
                                checked={memberForm.is_head_of_family}
                                onChange={e => {
                                    const isHead = e.target.checked;
                                    setMemberForm({
                                        ...memberForm,
                                        is_head_of_family: isHead,
                                        relationship_to_head: isHead ? "SELF" : "SON"
                                    });
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                                disabled={editingMember?.is_head_of_family}
                            />
                            <Label htmlFor="is_head" className="font-normal font-semibold">Set as Head of Family</Label>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={isMemberLoading}>
                                {isMemberLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingMember ? "Update Member" : "Add Member"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
