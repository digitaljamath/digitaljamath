"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Trash2, User, Home, Phone, Users, ArrowLeft, Loader2 } from "lucide-react";

type MemberFormData = {
    id: string | number;
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
    _isNew?: boolean;
    _isDeleted?: boolean;
};

const emptyMember = (): MemberFormData => ({
    id: `new_${crypto.randomUUID()}`,
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
    requirements: "",
    _isNew: true
});

export default function EditHouseholdPage() {
    const router = useRouter();
    const params = useParams();
    const householdId = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // Household fields
    const [address, setAddress] = useState("");
    const [economicStatus, setEconomicStatus] = useState("AAM");
    const [housingStatus, setHousingStatus] = useState("OWN");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [membershipId, setMembershipId] = useState("");

    // Members
    const [members, setMembers] = useState<MemberFormData[]>([]);

    useEffect(() => {
        fetchHousehold();
    }, [householdId]);

    const fetchHousehold = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const res = await fetch(`${apiBase}/api/jamath/households/${householdId}/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to fetch household");

            const data = await res.json();

            setAddress(data.address || "");
            setEconomicStatus(data.economic_status || "AAM");
            setHousingStatus(data.housing_status || "OWN");
            setPhoneNumber(data.phone_number || "");
            setMembershipId(data.membership_id || "");

            const membersList = (data.members || []).map((m: any) => ({
                id: m.id,
                full_name: m.full_name || "",
                is_head_of_family: m.is_head_of_family || false,
                relationship_to_head: m.relationship_to_head || "OTHER",
                gender: m.gender || "MALE",
                dob: m.dob || "",
                marital_status: m.marital_status || "SINGLE",
                education: m.education || "",
                profession: m.profession || "",
                skills: m.skills || "",
                is_employed: m.is_employed || false,
                monthly_income: m.monthly_income ? String(m.monthly_income) : "",
                requirements: m.requirements || "",
                _isNew: false,
                _isDeleted: false
            }));

            setMembers(membersList.length > 0 ? membersList : [emptyMember()]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const addMember = () => {
        setMembers([...members, emptyMember()]);
    };

    const removeMember = (id: string | number) => {
        const member = members.find(m => m.id === id);
        if (member?._isNew) {
            setMembers(members.filter(m => m.id !== id));
        } else {
            setMembers(members.map(m =>
                m.id === id ? { ...m, _isDeleted: true } : m
            ));
        }
    };

    const updateMember = (id: string | number, field: keyof MemberFormData, value: any) => {
        setMembers(members.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const setHeadOfFamily = (id: string | number) => {
        setMembers(members.map(m => ({
            ...m,
            is_head_of_family: m.id === id,
            relationship_to_head: m.id === id ? "SELF" : m.relationship_to_head === "SELF" ? "OTHER" : m.relationship_to_head
        })));
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);
        setError("");

        const activeMembers = members.filter(m => !m._isDeleted);
        if (!activeMembers.some(m => m.is_head_of_family)) {
            setError("Please designate a head of family");
            setIsSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            };

            // Update household
            const hhRes = await fetch(`${apiBase}/api/jamath/households/${householdId}/`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    address,
                    economic_status: economicStatus,
                    housing_status: housingStatus,
                    phone_number: phoneNumber || null,
                    membership_id: membershipId || null,
                })
            });

            if (!hhRes.ok) {
                const errData = await hhRes.json();
                throw new Error(JSON.stringify(errData));
            }

            // Handle members
            for (const member of members) {
                const memberData = {
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

                if (member._isDeleted && !member._isNew) {
                    // Delete existing member
                    await fetch(`${apiBase}/api/jamath/members/${member.id}/`, {
                        method: "DELETE",
                        headers
                    });
                } else if (member._isNew && !member._isDeleted) {
                    // Create new member
                    await fetch(`${apiBase}/api/jamath/members/`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(memberData)
                    });
                } else if (!member._isNew && !member._isDeleted) {
                    // Update existing member
                    await fetch(`${apiBase}/api/jamath/members/${member.id}/`, {
                        method: "PUT",
                        headers,
                        body: JSON.stringify(memberData)
                    });
                }
            }

            router.push(`/dashboard/households/${householdId}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to update household");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const activeMembers = members.filter(m => !m._isDeleted);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Household</h1>
                    <p className="text-gray-500 mt-1">Update household and member information</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Household Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" /> Household Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="address">Full Address *</Label>
                            <Textarea
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="membership_id">Membership ID</Label>
                            <Input
                                id="membership_id"
                                value={membershipId}
                                onChange={(e) => setMembershipId(e.target.value)}
                            />
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
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Economic Status</Label>
                            <Select value={economicStatus} onValueChange={setEconomicStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ZAKAT_ELIGIBLE">Mustahiq (Zakat Eligible)</SelectItem>
                                    <SelectItem value="AAM">Aam / Sahib-e-Nisab</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Housing Status</Label>
                            <Select value={housingStatus} onValueChange={setHousingStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <Users className="h-5 w-5" /> Family Members ({activeMembers.length})
                                </CardTitle>
                            </div>
                            <Button type="button" variant="outline" onClick={addMember}>
                                <Plus className="h-4 w-4 mr-2" /> Add Member
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {activeMembers.map((member, index) => (
                            <div key={member.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-gray-500" />
                                        <span className="font-medium">Member {index + 1}</span>
                                        {member.is_head_of_family && (
                                            <Badge className="bg-blue-100 text-blue-800">Head</Badge>
                                        )}
                                        {member._isNew && (
                                            <Badge variant="outline" className="text-green-600">New</Badge>
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
                                        {activeMembers.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
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
                                        <Input
                                            type="date"
                                            value={member.dob}
                                            onChange={(e) => updateMember(member.id, 'dob', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Relationship</Label>
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
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Profession</Label>
                                        <Input
                                            value={member.profession}
                                            onChange={(e) => updateMember(member.id, 'profession', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Skills</Label>
                                        <Input
                                            value={member.skills}
                                            onChange={(e) => updateMember(member.id, 'skills', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Monthly Income (₹)</Label>
                                        <Input
                                            type="number"
                                            value={member.monthly_income}
                                            onChange={(e) => updateMember(member.id, 'monthly_income', e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Special Requirements</Label>
                                        <Textarea
                                            value={member.requirements}
                                            onChange={(e) => updateMember(member.id, 'requirements', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving} size="lg">
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
