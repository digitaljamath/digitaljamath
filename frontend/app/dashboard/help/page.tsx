"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    HelpCircle, Send, Loader2, Sparkles,
    Users, DollarSign, ClipboardCheck, Megaphone,
    BarChart3, Heart, Building2, FileText,
    ChevronRight, ExternalLink
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const FEATURES = [
    {
        title: "Households (Jamath)",
        icon: Users,
        color: "from-blue-500 to-cyan-500",
        description: "Manage families and community members",
        items: [
            "Register new households with head, address, occupation",
            "Add family members with relationships",
            "Track membership status and fees",
            "View household details and history"
        ],
        link: "/dashboard/households"
    },
    {
        title: "Baitul Maal (Finance)",
        icon: DollarSign,
        color: "from-emerald-500 to-teal-500",
        description: "Double-entry accounting with fund restrictions",
        items: [
            "Receipt Vouchers for donations and income",
            "Payment Vouchers for expenses and bills",
            "Journal Entries for adjustments",
            "Chart of Accounts with Zakat/Sadaqah tagging"
        ],
        link: "/dashboard/finance"
    },
    {
        title: "Reports & Export",
        icon: BarChart3,
        color: "from-purple-500 to-pink-500",
        description: "Financial reports and Tally-compatible exports",
        items: [
            "Day Book (Roznamcha) - daily transactions",
            "Trial Balance - ledger summary",
            "Excel Export with donor list for Form 10BD",
            "Financial year selection"
        ],
        link: "/dashboard/finance/reports"
    },
    {
        title: "Surveys (Tahqeeq)",
        icon: ClipboardCheck,
        color: "from-orange-500 to-red-500",
        description: "Create and manage community surveys",
        items: [
            "Build custom forms with various question types",
            "Collect household responses",
            "Export survey data"
        ],
        link: "/dashboard/surveys"
    },
    {
        title: "Announcements",
        icon: Megaphone,
        color: "from-indigo-500 to-violet-500",
        description: "Community notices and updates",
        items: [
            "Create and publish announcements",
            "Schedule for future publishing",
            "Draft management"
        ],
        link: "/dashboard/announcements"
    },
    {
        title: "Welfare (Khidmat)",
        icon: Heart,
        color: "from-rose-500 to-pink-500",
        description: "Volunteer and welfare management",
        items: [
            "Volunteer registration",
            "Grant applications",
            "Welfare tracking"
        ],
        link: "/dashboard/welfare"
    }
];

const QUICK_GUIDES = [
    {
        title: "Record a Donation",
        steps: ["Go to Finance → New Entry", "Select Receipt tab", "Choose donor (or Guest)", "Add ledger entries (Debit: Cash, Credit: Donation)", "Save Voucher"]
    },
    {
        title: "Record an Expense",
        steps: ["Go to Finance → New Entry", "Select Payment tab", "Add or select Supplier", "Add ledger entries (Debit: Expense, Credit: Cash)", "Save Voucher"]
    },
    {
        title: "Create a New Fund",
        steps: ["Go to Finance → Chart of Accounts", "Click Add Account", "Create Income account (e.g., 3010 - Kabrastan Donation)", "Create matching Expense account (e.g., 4011 - Kabrastan Expense)", "Use in vouchers"]
    },
    {
        title: "Export for CA",
        steps: ["Go to Finance → Reports", "Select Export to Excel tab", "Choose Financial Year", "Click Download Excel File", "Share with Chartered Accountant"]
    }
];

export default function HelpPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetchWithAuth("/api/basira/", {
                method: "POST",
                body: JSON.stringify({
                    message: text,
                    history: messages
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
                    <Sparkles className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Help & Support</h1>
                    <p className="text-gray-500">Ask Basira or browse documentation</p>
                </div>
            </div>

            {/* Chat with Basira */}
            <Card className="border-2 border-emerald-200 bg-emerald-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                        Ask Basira (بصيرة)
                    </CardTitle>
                    <CardDescription>Your AI guide for Project Mizan</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Messages */}
                    <div className="bg-white rounded-lg border p-4 mb-4 max-h-80 min-h-[150px] overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p>Assalamu Alaikum! Ask me anything about Project Mizan.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === "user"
                                                ? "bg-emerald-500 text-white"
                                                : "bg-gray-100 text-gray-800"
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Thinking...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                            placeholder="Type your question..."
                            disabled={isLoading}
                        />
                        <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="bg-emerald-500 hover:bg-emerald-600">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Guides */}
            <div>
                <h2 className="text-xl font-bold mb-4">Quick Guides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {QUICK_GUIDES.map((guide, idx) => (
                        <Card key={idx}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    {guide.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                                    {guide.steps.map((step, stepIdx) => (
                                        <li key={stepIdx}>{step}</li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Feature Documentation */}
            <div>
                <h2 className="text-xl font-bold mb-4">Feature Documentation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FEATURES.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={idx} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color} text-white`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <Link href={feature.link}>
                                            <Button variant="ghost" size="icon">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                    <CardTitle className="text-base mt-2">{feature.title}</CardTitle>
                                    <CardDescription className="text-xs">{feature.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        {feature.items.map((item, itemIdx) => (
                                            <li key={itemIdx} className="flex items-start gap-2">
                                                <ChevronRight className="h-3 w-3 mt-1 text-gray-400" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Version Info */}
            <div className="text-center text-sm text-gray-400 pt-4 border-t">
                <p>Project Mizan v0.2-alpha • Basira AI Guide powered by OpenRouter</p>
            </div>
        </div>
    );
}
