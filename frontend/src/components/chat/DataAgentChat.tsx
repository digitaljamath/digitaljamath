import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED_PROMPTS = [
    "How many households do we have?",
    "Show me member demographics",
    "What is our total income this month?",
    "How many members are employed?",
    "Summary of recent transactions",
    "Search household 9876543210",
];

export function DataAgentChat() {
    const [messages, setMessages] = useState<Message[]>([{
        role: "assistant",
        content: "Assalamu Alaikum! I'm Basira, your data assistant. I can help you explore your Jamath data — ask me about households, members, finances, or any insights you need."
    }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetchWithAuth("/api/basira/data-query/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-4).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Server error:", response.status, errorData);
                throw new Error(`Server error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";

            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                assistantMessage += parsed.content;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = {
                                        role: "assistant",
                                        content: assistantMessage
                                    };
                                    return newMessages;
                                });
                            } else if (parsed.error) {
                                // Handle error from backend stream
                                assistantMessage = `⚠️ ${parsed.error}`;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = {
                                        role: "assistant",
                                        content: assistantMessage
                                    };
                                    return newMessages;
                                });
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error("Error:", error);
            setMessages(prev => {
                // If the last message was the optimistic empty assistant message, update it
                if (prev[prev.length - 1].role === "assistant") {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: "assistant",
                        content: `I'm having trouble connecting. Error: ${error.message || 'Unknown error'}`
                    };
                    return newMessages;
                }
                // Otherwise append a new error message
                return [...prev, {
                    role: "assistant",
                    content: `I'm having trouble connecting. Error: ${error.message || 'Unknown error'}`
                }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestedPrompt = (prompt: string) => {
        setInput(prompt);
    };

    const handleClearChat = () => {
        setMessages([{
            role: "assistant",
            content: "Chat cleared. How can I help you with your Jamath data?"
        }]);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                    : "bg-white border border-gray-200 shadow-sm"
                                    }`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        <span>Basira Data Agent</span>
                                    </div>
                                )}
                                <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                                    {msg.role === "assistant" ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Fixed Bottom Section */}
            <div className="border-t border-gray-200 bg-white/90 backdrop-blur-sm p-4">
                <div className="max-w-3xl mx-auto space-y-3">
                    {/* Suggested Prompts */}
                    {messages.length <= 2 && (
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestedPrompt(prompt)}
                                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearChat}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            title="Clear chat"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                placeholder="Ask about your Jamath data..."
                                className="pr-12 py-6 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg h-8 w-8"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
