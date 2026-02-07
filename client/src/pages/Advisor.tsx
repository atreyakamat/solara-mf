import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Advisor() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useConversations();
  const { mutate: createConv } = useCreateConversation();
  const { messages, sendMessage, isStreaming } = useChatStream(activeId);

  // Auto-select first conversation or create one if none exist
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !activeId) return;
    sendMessage(input);
    setInput("");
  };

  const handleNewChat = () => {
    createConv("New Consultation", {
      onSuccess: (data) => setActiveId(data.id)
    });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex gap-6 rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
        {/* Sidebar */}
        <div className="w-64 bg-secondary/30 border-r border-border flex flex-col hidden md:flex">
          <div className="p-4">
            <Button onClick={handleNewChat} className="w-full gap-2 shadow-sm" variant="outline">
              <Plus className="w-4 h-4" /> New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1">
              {conversations?.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    activeId === conv.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4 opacity-70" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background/50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth" ref={scrollRef}>
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                   <Bot className="w-8 h-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold">FundFlow Advisor</h3>
                   <p className="max-w-xs mx-auto text-sm mt-2">
                     Ask about your portfolio, market trends, or get personalized investment advice.
                   </p>
                 </div>
               </div>
            ) : (
              messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-3xl",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                  )}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%]",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border border-border rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))
            )}
            {isStreaming && (
              <div className="flex gap-4 mr-auto max-w-3xl animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                   <Bot className="w-4 h-4" />
                 </div>
                 <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-sm w-48 h-12" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <div className="max-w-3xl mx-auto flex gap-2 relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask your financial advisor..." 
                className="h-12 pl-4 pr-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary shadow-inner"
              />
              <Button 
                onClick={handleSend} 
                disabled={isStreaming || !input.trim()}
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 rounded-lg shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
