"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Users, ClipboardList, Wallet, ArrowLeft, Stamp, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";



export default function HouseholdDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [household, setHousehold] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [surveys, setSurveys] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDetails() {
            try {
                const token = localStorage.getItem("access_token");
                const headers = { "Authorization": `Bearer ${token}` };
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const apiBase = `${protocol}//${hostname}:8000`;

                // Fetch Household with Members
                const hhRes = await fetch(`${apiBase}/api/jamath/households/${params.id}/`, { headers });
                const hhData = await hhRes.json();
                setHousehold(hhData);

                // Fetch Transactions for this household
                const txRes = await fetch(`${apiBase}/api/finance/transactions/?linked_household=${params.id}`, { headers });
                const txData = await txRes.json();
                setTransactions(Array.isArray(txData) ? txData : []);

                // Fetch Survey Responses
                const svRes = await fetch(`${apiBase}/api/jamath/surveys/responses/?household=${params.id}`, { headers });
                const svData = await svRes.json();
                setSurveys(Array.isArray(svData) ? svData : []);

            } catch (error) {
                console.error("Failed to load details", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (params.id) fetchDetails();
    }, [params.id]);


    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!household) return <div className="p-8 text-center text-red-500">Household not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Breadcrumbs />
                <Button asChild>
                    <Link href={`/dashboard/households/${params.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit Household
                    </Link>
                </Button>
            </div>



            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {household.address}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-gray-500">
                        <Badge variant="outline" className="text-sm">ID: {household.membership_id || `#${params.id}`}</Badge>

                        <span>•</span>
                        <span>Added on {new Date(household.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`
                        px-3 py-1 text-sm font-medium
                        ${household.economic_status === 'ZAKAT_ELIGIBLE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}
                    `}>
                        {household.economic_status === 'ZAKAT_ELIGIBLE' ? 'Zakat Eligible' : 'Aam / Sahib-e-Nisab'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Members */}
                <Card className="lg:col-span-2 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Family Members ({household.members?.length || 0})
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Gender</TableHead>
                                    <TableHead>Age</TableHead>
                                    <TableHead>Marital Status</TableHead>
                                    <TableHead>Education</TableHead>
                                    <TableHead>Profession / Skills</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {household.members?.map((m: any) => (

                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">
                                            {m.full_name}
                                            {m.is_head_of_family && <Badge variant="secondary" className="ml-2 text-xs">Head</Badge>}
                                        </TableCell>
                                        <TableCell>{m.gender === 'MALE' ? 'Male' : 'Female'}</TableCell>
                                        <TableCell>{m.age ?? calculateAge(m.dob)}</TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-0.5 rounded ${m.marital_status === 'MARRIED' ? 'bg-blue-50 text-blue-700' :
                                                m.marital_status === 'WIDOWED' ? 'bg-amber-50 text-amber-700' :
                                                    m.marital_status === 'DIVORCED' ? 'bg-red-50 text-red-700' :
                                                        'bg-gray-50 text-gray-600'
                                                }`}>
                                                {m.marital_status || 'Single'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">{m.education || "-"}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="text-gray-900">{m.profession || "Not specified"}</div>
                                                {m.skills && <div className="text-xs text-gray-500">{m.skills}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={m.is_alive ? "outline" : "destructive"} className="text-xs">
                                                {m.is_alive ? "Alive" : "Deceased"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Right Column: Stats & Actions */}
                <div className="space-y-6">
                    {/* Financial Summary */}
                    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wallet className="h-4 w-4 text-emerald-500" />
                                Financial History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 mb-4">
                                ₹{transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0).toLocaleString()}
                            </div>
                            <div className="space-y-3">
                                {transactions.slice(0, 5).map((t: any) => (
                                    <div key={t.id} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                        <span className="text-gray-600 truncate max-w-[150px]">{t.description}</span>
                                        <span className="font-medium text-emerald-600">+₹{parseFloat(t.amount).toLocaleString()}</span>
                                    </div>
                                ))}
                                {transactions.length === 0 && <p className="text-sm text-gray-400">No donations recorded.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Survey History (Audit Trail) */}
                    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardList className="h-4 w-4 text-purple-500" />
                                Survey / Audit Trail
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {surveys.map((s: any) => (
                                <div key={s.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="font-medium text-sm text-gray-900">{s.survey_title || "General Survey"}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <Stamp className="h-3 w-3" />
                                        <span>Audited by: {s.auditor_name || "Admin"}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(s.submitted_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {surveys.length === 0 && <p className="text-sm text-gray-400">No surveys found.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

function calculateAge(dob: string) {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
