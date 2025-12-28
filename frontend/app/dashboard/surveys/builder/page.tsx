"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form Builder Component
type Question = {
    id: string;
    label: string;
    type: "text" | "number" | "boolean" | "select";
    options?: string; // Comma separated for "select"
};

export default function SurveyBuilderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<Question[]>([
        { id: "q1", label: "Example Question", type: "text" }
    ]);

    const addQuestion = () => {
        const nextId = `q${questions.length + 1}`;
        setQuestions([...questions, { id: nextId, label: "New Question", type: "text" }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof Question, value: string) => {
        const newQuestions = [...questions];
        // @ts-ignore
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    async function handleSave() {
        setIsLoading(true);
        const data = {
            title,
            description,
            schema: questions // The Backend stores this JSON definition
        };

        try {
            const res = await fetch("/api/jamath/surveys/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push("/dashboard/surveys");
                router.refresh();
            } else {
                alert("Failed to create survey");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Create New Survey</h1>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left: General Info */}
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Survey Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input placeholder="e.g. Zakat Assessment 2024" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea placeholder="Instructions for enumerators..." value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <Button className="w-full mt-4" onClick={handleSave} disabled={isLoading || !title}>
                                {isLoading ? "Saving..." : "Publish Survey"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Form Builder */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Form Questions</CardTitle>
                            <Button size="sm" variant="outline" onClick={addQuestion}>
                                <Plus className="mr-2 h-4 w-4" /> Add Question
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={idx} className="flex items-start space-x-3 p-3 border rounded bg-gray-50">
                                    <div className="mt-2"><GripVertical className="h-4 w-4 text-gray-400" /></div>
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Question Label"
                                            value={q.label}
                                            onChange={(e) => updateQuestion(idx, 'label', e.target.value)}
                                            className="font-medium"
                                        />
                                        <div className="flex space-x-2">
                                            <div className="w-1/3">
                                                <select
                                                    className="w-full p-2 text-sm border rounded"
                                                    value={q.type}
                                                    onChange={(e) => updateQuestion(idx, 'type', e.target.value as any)}
                                                >
                                                    <option value="text">Text Answer</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Yes/No</option>
                                                    <option value="select">Dropdown Options</option>
                                                </select>
                                            </div>
                                            {q.type === 'select' && (
                                                <Input
                                                    placeholder="Options (comma separated)"
                                                    value={q.options || ''}
                                                    onChange={(e) => updateQuestion(idx, 'options', e.target.value)}
                                                    className="flex-1 text-sm"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(idx)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
