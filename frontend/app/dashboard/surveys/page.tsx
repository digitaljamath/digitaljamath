"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, ClipboardCheck } from "lucide-react";

type Survey = {
    id: number;
    title: string;
    description: string;
    is_active: boolean;
    created_at: string;
};

export default function SurveysPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSurveys() {
            try {
                const res = await fetch("/api/jamath/surveys/");
                if (res.ok) {
                    const data = await res.json();
                    setSurveys(data);
                }
            } catch (error) {
                console.error("Failed to fetch surveys", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSurveys();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Surveys & Forms</h1>
                <Button asChild>
                    <Link href="/dashboard/surveys/builder">
                        <Plus className="mr-2 h-4 w-4" /> Create New Survey
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div>Loading...</div>
                ) : surveys.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-12">
                        No surveys active. Create one to collect data.
                    </div>
                ) : (
                    surveys.map((survey) => (
                        <Card key={survey.id} className="hover:bg-gray-50 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-2">
                                        <ClipboardCheck className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-lg font-medium">{survey.title}</CardTitle>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${survey.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {survey.is_active ? 'Active' : 'Closed'}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 line-clamp-2">{survey.description || "No description"}</p>
                                <div className="mt-4 flex justify-between text-sm">
                                    <span className="text-gray-400 text-xs">Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                                    {/* <Link href={`/dashboard/surveys/${survey.id}/responses`} className="text-blue-600 hover:underline">
                                        View Responses
                                    </Link> */}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
