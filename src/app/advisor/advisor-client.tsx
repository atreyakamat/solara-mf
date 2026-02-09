"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Send,
    Bot,
    User,
    Sparkles,
    MessageSquarePlus,
    Lightbulb,
    TrendingUp,
    PiggyBank,
    Shield,
    Calculator
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
}

// Suggested prompts sidebar
const suggestedPrompts = [
    { icon: TrendingUp, text: "Best funds for wealth creation?", category: "Growth" },
    { icon: PiggyBank, text: "How to start SIP with ₹5000?", category: "Beginner" },
    { icon: Shield, text: "Low risk funds for retirement", category: "Conservative" },
    { icon: Calculator, text: "Compare ELSS vs PPF for tax saving", category: "Tax" },
    { icon: Lightbulb, text: "Explain expense ratio impact", category: "Learn" },
];

export function AdvisorClient() {
    const [conversations, setConversations] = useState<Conversation[]>([
        { id: "1", title: "New Chat", messages: [], createdAt: new Date() }
    ]);
    const [activeConvId, setActiveConvId] = useState("1");
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConvId);
    const messages = activeConversation?.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleNewChat = () => {
        const newConv: Conversation = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
            createdAt: new Date()
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
    };

    const handleSend = async (text?: string) => {
        const messageText = text || input;
        if (!messageText.trim() || isStreaming) return;

        setIsStreaming(true);
        const userMsg: Message = { role: "user", content: messageText };

        setConversations(prev => prev.map(c =>
            c.id === activeConvId
                ? {
                    ...c,
                    messages: [...c.messages, userMsg, { role: "assistant", content: "" }],
                    title: c.messages.length === 0 ? messageText.slice(0, 30) + "..." : c.title
                }
                : c
        ));
        setInput("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: messageText,
                    context: "User is on the AI Advisor page for in-depth financial advice."
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
                                setConversations(prev => prev.map(c => {
                                    if (c.id !== activeConvId) return c;
                                    const msgs = [...c.messages];
                                    const lastMsg = msgs[msgs.length - 1];
                                    if (lastMsg?.role === "assistant") {
                                        lastMsg.content = assistantResponse;
                                    }
                                    return { ...c, messages: msgs };
                                }));
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
            // Remove empty assistant message on error
            setConversations(prev => prev.map(c =>
                c.id === activeConvId
                    ? { ...c, messages: c.messages.slice(0, -1) }
                    : c
            ));
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Sidebar - Conversations & Prompts */}
            <div className="hidden lg:flex w-80 flex-col gap-4">
                {/* New Chat Button */}
                <Button onClick={handleNewChat} className="w-full">
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    New Chat
                </Button>

                {/* Conversation History */}
                <Card className="flex-1 p-4">
                    <h3 className="text-sm font-bold mb-3 text-muted-foreground">Recent Chats</h3>
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-1">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConvId(conv.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate",
                                        conv.id === activeConvId
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-secondary text-muted-foreground"
                                    )}
                                >
                                    {conv.title}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Suggested Prompts */}
                <Card className="p-4">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Suggested Questions
                    </h3>
                    <div className="space-y-2">
                        {suggestedPrompts.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(prompt.text)}
                                disabled={isStreaming}
                                className="w-full flex items-start gap-2 p-2 rounded-lg text-left hover:bg-secondary transition-colors group"
                            >
                                <prompt.icon className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div>
                                    <p className="text-sm">{prompt.text}</p>
                                    <p className="text-xs text-muted-foreground">{prompt.category}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold">AI Investment Advisor</h2>
                            <p className="text-xs text-muted-foreground">Personalized financial guidance</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Bot className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-display font-bold mb-2">How can I help you today?</h3>
                            <p className="text-muted-foreground mb-6">
                                I can help you with investment strategies, fund selection, portfolio review, and more.
                            </p>

                            {/* Quick prompts for mobile */}
                            <div className="lg:hidden flex flex-wrap justify-center gap-2">
                                {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(prompt.text)}
                                        className="px-4 py-2 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                                    >
                                        {prompt.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <AnimatePresence>
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-3",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                                                <Bot className="w-4 h-4 text-accent-foreground" />
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[80%] px-4 py-3 rounded-2xl",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-secondary rounded-tl-sm"
                                        )}>
                                            <p className="text-sm whitespace-pre-wrap">
                                                {msg.content || (isStreaming && msg.role === "assistant" ? (
                                                    <span className="inline-flex gap-1">
                                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                    </span>
                                                ) : "")}
                                            </p>
                                        </div>

                                        {msg.role === "user" && (
                                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-primary-foreground" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border bg-background">
                    <div className="flex gap-3 max-w-3xl mx-auto">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Ask me anything about investing..."
                            className="h-12 bg-secondary border-transparent text-base"
                            disabled={isStreaming}
                        />
                        <Button
                            size="lg"
                            onClick={() => handleSend()}
                            disabled={isStreaming || !input.trim()}
                            className="h-12 px-6"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
