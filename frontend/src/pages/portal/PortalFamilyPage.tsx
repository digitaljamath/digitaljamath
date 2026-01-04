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
import { getApiBaseUrl } from "@/lib/config";

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
    });

    useEffect(() => {
        fetchFamily();
    }, []);

    const fetchFamily = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/portal/profile/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setHousehold(data);
            } else if (res.status === 401) {
                navigate('/portal/login');
            }
        } catch (err) {
            console.error("Failed to fetch family", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!formData.full_name) {
            setError("Full name is required");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const token = localStorage.getItem('access_token');
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/api/portal/members/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setFormData({
                    full_name: '',
                    relationship_to_head: 'OTHER',
                    gender: 'MALE',
                    marital_status: 'SINGLE',
                    profession: '',
                    education: '',
                });
                fetchFamily(); // Refresh list
            } else {
                const data = await res.json();
                setError(data.error || "Failed to add member");
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/portal">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Family Profile</h1>
                            <p className="text-sm text-gray-500">View and update your household</p>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add Family Member</DialogTitle>
                                <DialogDescription>
                                    Enter details for the new family member. Note: All additions require approval from the Jamath office.
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
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleAddMember}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Submit for Approval
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

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
                                            <TableHead>Age</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {household.members?.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium">{member.full_name}</span>
                                                        {member.is_head_of_family && (
                                                            <Badge variant="outline" className="text-xs">Head</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getRelationshipLabel(member.relationship_to_head)}
                                                </TableCell>
                                                <TableCell>
                                                    {member.age ? `${member.age} yrs` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                                                        {member.profession && (
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase className="h-3 w-3" />
                                                                {member.profession}
                                                            </span>
                                                        )}
                                                        {member.education && (
                                                            <span className="flex items-center gap-1">
                                                                <GraduationCap className="h-3 w-3" />
                                                                {member.education}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="text-center text-sm text-gray-500">
                            <p>To update family information, please contact the Jamath office.</p>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        Household not found
                    </div>
                )}
            </div>
        </div>
    );
}
