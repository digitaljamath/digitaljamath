import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, User, Calendar, Briefcase, GraduationCap, Plus, Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
// import { getApiBaseUrl } from "@/lib/config";
import { fetchWithAuth } from "@/lib/api";

interface Member {
    id: number;
    full_name: string;
    relationship_to_head: string;
    gender: string;
    age?: number;
    dob?: string;
    marital_status: string;
    profession?: string;
    education?: string;
    is_head_of_family: boolean;
}

interface Household {
    id: number;
    membership_id: string;
    address: string;
    phone_number: string;
    members: Member[];
}

export function PortalFamilyPage() {
    const navigate = useNavigate();
    const [household, setHousehold] = useState<Household | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        full_name: '',
        relationship_to_head: 'OTHER',
        gender: 'MALE',
        marital_status: 'SINGLE',
        profession: '',
        education: '',
        dob: '',
    });

    const [editingMember, setEditingMember] = useState<Member | null>(null);

    useEffect(() => {
        fetchFamily();
    }, []);

    const fetchFamily = async () => {
        try {

            const res = await fetchWithAuth('/api/portal/profile/', {}, 'portal');

            if (res.ok) {
                const data = await res.json();
                setHousehold(data.household);
            } else if (res.status === 401) {
                navigate('/portal/login');
            }
        } catch (err) {
            console.error("Failed to fetch family", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingMember(null);
        setFormData({
            full_name: '',
            relationship_to_head: 'OTHER',
            gender: 'MALE',
            marital_status: 'SINGLE',
            profession: '',
            education: '',
            dob: '',
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (member: Member) => {
        setEditingMember(member);
        setFormData({
            full_name: member.full_name,
            relationship_to_head: member.relationship_to_head,
            gender: member.gender,
            marital_status: member.marital_status,
            profession: member.profession || '',
            education: member.education || '',
            dob: member.dob || '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.full_name) {
            setError("Full name is required");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Determine API method and payload
            const method = editingMember ? 'PUT' : 'POST';

            // Sanitize payload: convert empty strings to null for optional fields like dob
            const payload = {
                ...(editingMember ? { ...formData, id: editingMember.id } : formData),
                dob: formData.dob || null,
                // profession/education/skills allow blank strings in model usually, but dob must be null if blank
            };

            const res = await fetchWithAuth(`/api/portal/members/`, {
                method: method,
                body: JSON.stringify(payload)
            }, 'portal');

            if (res.ok) {
                setIsDialogOpen(false);
                fetchFamily(); // Refresh list
            } else {
                const data = await res.json();
                setError(data.error || "Failed to save member");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRelationshipLabel = (rel: string) => {
        const labels: Record<string, string> = {
            'SELF': '👤 Head',
            'SPOUSE': '💑 Spouse',
            'SON': '👦 Son',
            'DAUGHTER': '👧 Daughter',
            'FATHER': '👴 Father',
            'MOTHER': '👵 Mother',
            'BROTHER': '👨 Brother',
            'SISTER': '👩 Sister',
            'OTHER': 'Other'
        };
        return labels[rel] || rel;
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header / App Bar */}
            <header className="bg-white border-b sticky top-0 z-50 h-[56px] flex items-center shadow-sm">
                <div className="w-full max-w-[420px] mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="active:scale-95 transition-transform">
                            <Link to="/portal/dashboard">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="font-bold text-lg tracking-tight text-gray-900">Family Profile</h1>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingMember ? 'Edit Member' : 'Add Family Member'}</DialogTitle>
                                <DialogDescription>
                                    {editingMember
                                        ? 'Update details for this family member.'
                                        : 'Enter details for the new family member.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        placeholder="Enter full name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="relation">Relationship</Label>
                                        <Select
                                            value={formData.relationship_to_head}
                                            onValueChange={(val) => setFormData({ ...formData, relationship_to_head: val })}
                                        >
                                            <SelectTrigger id="relation">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SPOUSE">Spouse</SelectItem>
                                                <SelectItem value="SON">Son</SelectItem>
                                                <SelectItem value="DAUGHTER">Daughter</SelectItem>
                                                <SelectItem value="FATHER">Father</SelectItem>
                                                <SelectItem value="MOTHER">Mother</SelectItem>
                                                <SelectItem value="BROTHER">Brother</SelectItem>
                                                <SelectItem value="SISTER">Sister</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(val) => setFormData({ ...formData, gender: val })}
                                        >
                                            <SelectTrigger id="gender">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="marital">Marital Status</Label>
                                        <Select
                                            value={formData.marital_status}
                                            onValueChange={(val) => setFormData({ ...formData, marital_status: val })}
                                        >
                                            <SelectTrigger id="marital">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SINGLE">Single</SelectItem>
                                                <SelectItem value="MARRIED">Married</SelectItem>
                                                <SelectItem value="WIDOWED">Widowed</SelectItem>
                                                <SelectItem value="DIVORCED">Divorced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="profession">Profession</Label>
                                        <Input
                                            id="profession"
                                            placeholder="Job/Student"
                                            value={formData.profession}
                                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Date of Birth</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.dob ? formData.dob.split('-')[2] : ''}
                                                onChange={(e) => {
                                                    const day = e.target.value;
                                                    const current = formData.dob ? formData.dob.split('-') : ['', '', ''];
                                                    const month = current[1] || '01';
                                                    const year = current[0] || '2000';
                                                    if (day) setFormData({ ...formData, dob: `${year}-${month}-${day}` });
                                                }}
                                            >
                                                <option value="">Day</option>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                                ))}
                                            </select>

                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.dob ? formData.dob.split('-')[1] : ''}
                                                onChange={(e) => {
                                                    const month = e.target.value;
                                                    const current = formData.dob ? formData.dob.split('-') : ['', '', ''];
                                                    const day = current[2] || '01';
                                                    const year = current[0] || '2000';
                                                    if (month) setFormData({ ...formData, dob: `${year}-${month}-${day}` });
                                                }}
                                            >
                                                <option value="">Month</option>
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                    <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                                                ))}
                                            </select>

                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.dob ? formData.dob.split('-')[0] : ''}
                                                onChange={(e) => {
                                                    const year = e.target.value;
                                                    const current = formData.dob ? formData.dob.split('-') : ['', '', ''];
                                                    const day = current[2] || '01';
                                                    const month = current[1] || '01';
                                                    if (year) setFormData({ ...formData, dob: `${year}-${month}-${day}` });
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
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {editingMember ? 'Update Member' : 'Add Member'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="w-full max-w-[420px] mx-auto px-4 py-6 flex-1">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : household ? (
                    <>
                        {/* Household Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Household #{household.membership_id}
                                </CardTitle>
                                <CardDescription>{household.address}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Phone:</span>
                                        <span className="ml-2 font-medium">{household.phone_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Members:</span>
                                        <span className="ml-2 font-medium">{household.members?.length || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Members List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Family Members</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Relation</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {household.members?.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <div className="font-medium">{member.full_name}</div>
                                                            {member.is_head_of_family && (
                                                                <Badge variant="outline" className="text-[10px] h-4">Head</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        {getRelationshipLabel(member.relationship_to_head)}
                                                        <div className="text-gray-500 mt-0.5">{member.age ? `${member.age}y` : ''}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                                                        {member.profession && (
                                                            <span className="truncate max-w-[80px]">
                                                                {member.profession}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleOpenEdit(member)}
                                                    >
                                                        <span className="text-blue-600 font-medium text-xs">Edit</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        Household not found
                    </div>
                )}
            </main>
        </div>
    );
}
