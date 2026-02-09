"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

// Context-aware suggested prompts based on current page
const getContextPrompts = (pathname: string): string[] => {
    if (pathname.startsWith("/funds/")) {
        return [
            "Analyze this fund's performance",
            "Compare with similar funds",
            "Is it good for long-term SIP?",
            "Explain the risk ratios"
        ];
    }
    if (pathname === "/simulator") {
        return [
            "Review my portfolio allocation",
            "Is my portfolio diversified enough?",
            "Suggest improvements",
            "What's the optimal allocation?"
        ];
    }
    if (pathname === "/advisor") {
        return [];
    }
    // Home page
    return [
        "Which fund is best for beginners?",
        "Compare large cap vs flexi cap",
        "Best SIP for tax saving",
        "Explain ELSS funds"
    ];
};

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const contextPrompts = getContextPrompts(pathname);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Don't show on advisor page (has full chat)
    if (pathname === "/advisor") {
        return null;
    }

    const handleSend = async (text?: string) => {
        const messageText = text || input;
        if (!messageText.trim()) return;

        setIsStreaming(true);
        const userMsg: Message = { role: "user", content: messageText };
        setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
        setInput("");

        try {
            const contextInfo = pathname.startsWith("/funds/")
                ? `User is viewing a fund detail page at ${pathname}. `
                : pathname === "/simulator"
                    ? "User is on the Portfolio Simulator page. "
                    : "User is on the Fund Explorer home page. ";

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: messageText,
                    context: contextInfo
                }),
            });

            if (!res.ok) throw new Error("Failed");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No response");

            let assistantResponse = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.content) {
                                assistantResponse += data.content;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMsg = newMessages[newMessages.length - 1];
                                    if (lastMsg.role === "assistant") {
                                        lastMsg.content = assistantResponse;
                                    }
                                    return [...newMessages];
                                });
                            }

                            if (data.done) {
                                setIsStreaming(false);
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        } catch {
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            size="lg"
                            className="rounded-full w-14 h-14 shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:scale-105"
                            onClick={() => setIsOpen(true)}
                        >
                            <MessageSquare className="w-6 h-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">AI Advisor</h3>
                                    <p className="text-xs text-muted-foreground">Ask me anything</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">How can I help?</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Get personalized investment advice
                                        </p>
                                    </div>

                                    {/* Context-aware prompts */}
                                    {contextPrompts.length > 0 && (
                                        <div className="space-y-2 w-full">
                                            <p className="text-xs text-muted-foreground">Try asking:</p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {contextPrompts.map((prompt, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSend(prompt)}
                                                        className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                                                    >
                                                        {prompt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-2",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                                                <Bot className="w-3 h-3 text-accent-foreground" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-secondary rounded-tl-sm"
                                        )}>
                                            {msg.content || (isStreaming && msg.role === "assistant" ? "..." : "")}
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                <User className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-border bg-background">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Ask a question..."
                                    className="h-10 bg-secondary border-transparent"
                                    disabled={isStreaming}
                                />
                                <Button
                                    size="icon"
                                    onClick={() => handleSend()}
                                    disabled={isStreaming || !input.trim()}
                                    className="h-10 w-10 shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
