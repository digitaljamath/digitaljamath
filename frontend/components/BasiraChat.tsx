"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Sparkles, HelpCircle } from "lucide-react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const QUICK_SUGGESTIONS = [
    "How do I record a donation?",
    "How to add a new family?",
    "How to create a new fund?",
    "How to export for CA?",
];

export default function BasiraChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent]);

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setStreamingContent("");

        try {
            const token = localStorage.getItem("access_token");
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = `${protocol}//${hostname}:8000`;

            const response = await fetch(`${apiBase}/api/basira/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: text,
                    history: messages,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error("Failed to connect");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                break;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    fullContent += parsed.content;
                                    setStreamingContent(fullContent);
                                }
                                if (parsed.error) {
                                    fullContent = parsed.error;
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }

            // Add the complete message
            if (fullContent) {
                setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
            }
            setStreamingContent("");

        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Connection error. Please check your internet and try again."
            }]);
        } finally {
            setIsLoading(false);
            setStreamingContent("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300
                    ${isOpen
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    }
                    text-white
                `}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">Basira</h3>
                                <p className="text-xs text-emerald-100">Your AI Guide • بصيرة</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-80 min-h-[200px]">
                        {messages.length === 0 && !streamingContent ? (
                            <div className="text-center text-gray-500 py-4">
                                <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="font-medium">Assalamu Alaikum!</p>
                                <p className="text-sm mt-1">How can I help you today?</p>

                                {/* Quick Suggestions */}
                                <div className="mt-4 space-y-2">
                                    {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => sendMessage(suggestion)}
                                            className="block w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === "user"
                                                    ? "bg-emerald-500 text-white rounded-br-md"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Streaming content */}
                                {streamingContent && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md">
                                            <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                                        </div>
                                    </div>
                                )}

                                {isLoading && !streamingContent && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                                <span className="text-sm text-gray-500">Connecting...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Basira anything..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading}
                                size="icon"
                                className="bg-emerald-500 hover:bg-emerald-600"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
