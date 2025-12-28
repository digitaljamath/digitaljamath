"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, User, Home, Phone, Users } from "lucide-react";

type MemberFormData = {
    id: string;
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

export default function NewHouseholdPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate at least one head of family
        if (!members.some(m => m.is_head_of_family)) {
            setError("Please designate a head of family");
            setIsLoading(false);
            return;
        }

        const householdData = {
            address,
            economic_status: economicStatus,
            housing_status: housingStatus,
            phone_number: phoneNumber || null,
            membership_id: membershipId || null,
        };

        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            // Create household
            const hhRes = await fetch(`${apiBase}/api/jamath/households/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(householdData)
            });

            if (!hhRes.ok) {
                const errData = await hhRes.json();
                throw new Error(JSON.stringify(errData));
            }

            const household = await hhRes.json();

            // Create members
            for (const member of members) {
                const memberData = {
                    household: household.id,
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

                await fetch(`${apiBase}/api/jamath/members/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(memberData)
                });
            }

            router.push(`/dashboard/households/${household.id}`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create household");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Register New Household</h1>
                <p className="text-gray-500 mt-1">Add a new family to the Jamath register</p>
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
                                            <Badge className="bg-blue-100 text-blue-800">Head of Family</Badge>
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
                                        <Input
                                            type="date"
                                            value={member.dob}
                                            onChange={(e) => updateMember(member.id, 'dob', e.target.value)}
                                        />
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
                                            placeholder="e.g., B.Tech, 10th Pass, Hafiz"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Profession / Occupation</Label>
                                        <Input
                                            value={member.profession}
                                            onChange={(e) => updateMember(member.id, 'profession', e.target.value)}
                                            placeholder="e.g., Software Engineer, Housewife"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Skills</Label>
                                        <Input
                                            value={member.skills}
                                            onChange={(e) => updateMember(member.id, 'skills', e.target.value)}
                                            placeholder="e.g., Tailoring, Driving, Cooking"
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

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading ? "Creating..." : "Register Household"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
