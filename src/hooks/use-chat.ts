import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    }
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  });
}

// Custom hook for chat streaming
export function useChatStream(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial history
  const { data: history, refetch } = useQuery({
    queryKey: ["/api/conversations", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
      return data;
    },
    enabled: !!conversationId,
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;

    setIsStreaming(true);
    setError(null);
    
    // Optimistic update
    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);

    try {
      abortControllerRef.current = new AbortController();
      
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No response body");

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
                  return newMessages;
                });
              }
              
              if (data.done) {
                setIsStreaming(false);
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
        setMessages(prev => prev.slice(0, -1)); // Remove empty assistant message on error
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [conversationId]);

  return { messages, sendMessage, isStreaming, error };
}
