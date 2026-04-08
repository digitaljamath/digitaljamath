import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Home, Phone, Plus, Trash2, User, Users, ArrowLeft, Loader2, Save } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type MemberFormData = {
    id: string; // Temporary ID for frontend keying
    full_name: string;
    is_head_of_family: boolean;
    relationship_to_head: string;
    gender: string;
    dob: string;
    marital_status: string;
    education: string;
    profession: string;
    skills: string;
    is_employed: boolean;
    monthly_income: string;
    requirements: string;
};

const emptyMember = (): MemberFormData => ({
    id: crypto.randomUUID(),
    full_name: "",
    is_head_of_family: false,
    relationship_to_head: "OTHER",
    gender: "MALE",
    dob: "",
    marital_status: "SINGLE",
    education: "",
    profession: "",
    skills: "",
    is_employed: false,
    monthly_income: "",
    requirements: ""
});

export function HouseholdFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);

    // Household fields
    const [address, setAddress] = useState("");
    const [economicStatus, setEconomicStatus] = useState("AAM");
    const [housingStatus, setHousingStatus] = useState("OWN");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [membershipId, setMembershipId] = useState("");

    // Members
    const [members, setMembers] = useState<MemberFormData[]>([
        { ...emptyMember(), is_head_of_family: true, relationship_to_head: "SELF" }
    ]);

    useEffect(() => {
        if (isEditMode) {
            async function fetchHousehold() {
                try {
                    const res = await fetchWithAuth(`/api/jamath/households/${id}/`);
                    if (!res.ok) throw new Error("Failed to load household");
                    const data = await res.json();

                    setAddress(data.address || "");
                    setEconomicStatus(data.economic_status || "AAM");
                    setHousingStatus(data.housing_status || "OWN");
                    setPhoneNumber(data.phone_number || "");
                    setMembershipId(data.membership_id || "");

                    if (data.members && data.members.length > 0) {
                        setMembers(data.members.map((m: any) => ({
                            id: m.id.toString(),
                            full_name: m.full_name,
                            is_head_of_family: m.is_head_of_family,
                            relationship_to_head: m.relationship_to_head,
                            gender: m.gender,
                            dob: m.dob || "",
                            marital_status: m.marital_status,
                            education: m.education || "",
                            profession: m.profession || "",
                            skills: m.skills || "",
                            is_employed: m.is_employed,
                            monthly_income: m.monthly_income ? m.monthly_income.toString() : "",
                            requirements: m.requirements || ""
                        })));
                    }
                } catch (error) {
                    console.error(error);
                    toast({
                        title: "Error",
                        description: "Could not load household details",
                        variant: "destructive"
                    });
                    navigate("/dashboard/households");
                } finally {
                    setIsFetching(false);
                }
            }
            fetchHousehold();
        }
    }, [id, isEditMode, navigate, toast]);

    const addMember = () => {
        setMembers([...members, emptyMember()]);
    };

    const removeMember = (id: string) => {
        if (members.length > 1) {
            setMembers(members.filter(m => m.id !== id));
        }
    };

    const updateMember = (id: string, field: keyof MemberFormData, value: any) => {
        setMembers(members.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const setHeadOfFamily = (id: string) => {
        setMembers(members.map(m => ({
            ...m,
            is_head_of_family: m.id === id,
            relationship_to_head: m.id === id ? "SELF" : m.relationship_to_head === "SELF" ? "OTHER" : m.relationship_to_head
        })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate at least one head of family
        if (!members.some(m => m.is_head_of_family)) {
            toast({
                title: "Validation Error",
                description: "Please designate a head of family",
                variant: "destructive"
            });
            setIsLoading(false);
            return;
        }

        try {
            const url = isEditMode
                ? `/api/jamath/households/${id}/`
                : "/api/jamath/households/";

            const method = isEditMode ? "PUT" : "POST";

            const householdPayload = {
                address,
                economic_status: economicStatus,
                housing_status: housingStatus,
                phone_number: phoneNumber || null,
                membership_id: membershipId || null,
            };

            const hhRes = await fetchWithAuth(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(householdPayload)
            });

            if (!hhRes.ok) {
                const err = await hhRes.json();
                throw new Error(err.detail || JSON.stringify(err));
            }

            const household = await hhRes.json();
            const householdId = household.id;

            // Handle members
            // In a real optimized scenario, we'd use a bulk update/create API. 
            // For now, mirroring Next.js logic: Loop and create/update.
            // CAUTION: This REST approach is chatty but effective given the Django ViewSet structure.

            // If editing, we need to be careful not to create duplicates if we are just updating.
            // The logic from Next.js was POSTing everything, which might duplicate members on Edit?
            // Actually Next.js logic shown was strictly for "NewHouseholdPage".
            // For Edit mode, we should ideally use PUT/PATCH on existing members.

            const memberPromises = members.map(async (member) => {
                const memberPayload = {
                    household: householdId,
                    full_name: member.full_name,
                    is_head_of_family: member.is_head_of_family,
                    relationship_to_head: member.relationship_to_head,
                    gender: member.gender,
                    dob: member.dob || null,
                    marital_status: member.marital_status,
                    education: member.education || null,
                    profession: member.profession || null,
                    skills: member.skills || null,
                    is_employed: member.is_employed,
                    monthly_income: member.monthly_income ? parseFloat(member.monthly_income) : null,
                    requirements: member.requirements || null
                };

                // If member has a numeric ID (from backend), update it.
                // If it looks like a UUID (crypto.randomUUID), create it.
                const isNewMember = member.id.length > 20; // safe assumption vs integer ID

                if (isNewMember) {
                    return fetchWithAuth("/api/jamath/members/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(memberPayload)
                    });
                } else {
                    return fetchWithAuth(`/api/jamath/members/${member.id}/`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(memberPayload)
                    });
                }
            });

            await Promise.all(memberPromises);

            toast({
                title: "Success",
                description: `Household ${isEditMode ? "updated" : "created"} successfully`
            });

            navigate(`/dashboard/households/${householdId}`);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to save household",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/dashboard/households">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditMode ? "Edit Household" : "Register New Household"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isEditMode ? "Update details and members" : "Add a new family to the Jamath register"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Household Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" /> Household Information
                        </CardTitle>
                        <CardDescription>Basic details about the household</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="address">Full Address *</Label>
                            <Textarea
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                placeholder="e.g., No. 45, Tannery Road, Frazer Town, Bangalore"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="membership_id">Membership ID (Optional)</Label>
                            <Input
                                id="membership_id"
                                value={membershipId}
                                onChange={(e) => setMembershipId(e.target.value)}
                                placeholder="Auto-generated if left blank"
                            />
                            <p className="text-xs text-gray-500">Leave blank to auto-generate (e.g., JM-001)</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Primary Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Economic Status (Maali Halat) *</Label>
                            <Select value={economicStatus} onValueChange={setEconomicStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ZAKAT_ELIGIBLE">Mustahiq (Zakat Eligible)</SelectItem>
                                    <SelectItem value="AAM">Aam / Sahib-e-Nisab</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Housing Status</Label>
                            <Select value={housingStatus} onValueChange={setHousingStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OWN">Own House</SelectItem>
                                    <SelectItem value="RENTED">Rented</SelectItem>
                                    <SelectItem value="FAMILY">Family Property</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Family Members */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" /> Family Members
                                </CardTitle>
                                <CardDescription>Add all family members living in this household</CardDescription>
                            </div>
                            <Button type="button" variant="outline" onClick={addMember}>
                                <Plus className="h-4 w-4 mr-2" /> Add Member
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {members.map((member, index) => (
                            <div key={member.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-gray-500" />
                                        <span className="font-medium">Member {index + 1}</span>
                                        {member.is_head_of_family && (
                                            <Badge className="bg-blue-100 text-blue-800 border-0">Head of Family</Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {!member.is_head_of_family && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setHeadOfFamily(member.id)}
                                            >
                                                Set as Head
                                            </Button>
                                        )}
                                        {members.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeMember(member.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name *</Label>
                                        <Input
                                            value={member.full_name}
                                            onChange={(e) => updateMember(member.id, 'full_name', e.target.value)}
                                            required
                                            placeholder="e.g., Mohammed Ahmed Khan"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select
                                            value={member.gender}
                                            onValueChange={(v) => updateMember(member.id, 'gender', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date of Birth</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={member.dob ? member.dob.split('-')[2] : ''}
                                                onChange={(e) => {
                                                    const day = e.target.value;
                                                    const current = member.dob ? member.dob.split('-') : ['', '', ''];
                                                    const month = current[1] || '01';
                                                    const year = current[0] || '2000';
                                                    if (day) updateMember(member.id, 'dob', `${year}-${month}-${day}`);
                                                }}
                                            >
                                                <option value="">Day</option>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>
                                                ))}
                                            </select>

                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={member.dob ? member.dob.split('-')[1] : ''}
                                                onChange={(e) => {
                                                    const month = e.target.value;
                                                    const current = member.dob ? member.dob.split('-') : ['', '', ''];
                                                    const day = current[2] || '01';
                                                    const year = current[0] || '2000';
                                                    if (month) updateMember(member.id, 'dob', `${year}-${month}-${day}`);
                                                }}
                                            >
                                                <option value="">Month</option>
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                    <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                                                ))}
                                            </select>

                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={member.dob ? member.dob.split('-')[0] : ''}
                                                onChange={(e) => {
                                                    const year = e.target.value;
                                                    const current = member.dob ? member.dob.split('-') : ['', '', ''];
                                                    const day = current[2] || '01';
                                                    const month = current[1] || '01';
                                                    if (year) updateMember(member.id, 'dob', `${year}-${month}-${day}`);
                                                }}
                                            >
                                                <option value="">Year</option>
                                                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Relationship to Head</Label>
                                        <Select
                                            value={member.relationship_to_head}
                                            onValueChange={(v) => updateMember(member.id, 'relationship_to_head', v)}
                                            disabled={member.is_head_of_family}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SELF">Self (Head)</SelectItem>
                                                <SelectItem value="SPOUSE">Spouse</SelectItem>
                                                <SelectItem value="SON">Son</SelectItem>
                                                <SelectItem value="DAUGHTER">Daughter</SelectItem>
                                                <SelectItem value="PARENT">Parent</SelectItem>
                                                <SelectItem value="SIBLING">Sibling</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Marital Status</Label>
                                        <Select
                                            value={member.marital_status}
                                            onValueChange={(v) => updateMember(member.id, 'marital_status', v)}
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

                                    <div className="space-y-2">
                                        <Label>Education</Label>
                                        <Input
                                            value={member.education}
                                            onChange={(e) => updateMember(member.id, 'education', e.target.value)}
                                            placeholder="e.g., B.Tech, 10th Pass"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Profession / Occupation</Label>
                                        <Input
                                            value={member.profession}
                                            onChange={(e) => updateMember(member.id, 'profession', e.target.value)}
                                            placeholder="e.g., Software Engineer"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Skills</Label>
                                        <Input
                                            value={member.skills}
                                            onChange={(e) => updateMember(member.id, 'skills', e.target.value)}
                                            placeholder="e.g., Tailoring, Driving"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Monthly Income (₹)</Label>
                                        <Input
                                            type="number"
                                            value={member.monthly_income}
                                            onChange={(e) => updateMember(member.id, 'monthly_income', e.target.value)}
                                            placeholder="e.g., 25000"
                                        />
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Special Requirements / Needs</Label>
                                        <Textarea
                                            value={member.requirements}
                                            onChange={(e) => updateMember(member.id, 'requirements', e.target.value)}
                                            placeholder="e.g., Dialysis support, wheelchair bound, chronic illness..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Submit Actions */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" asChild>
                        <Link to="/dashboard/households">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading} size="lg" className="min-w-[150px]">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditMode ? "Update Household" : "Register Household"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
