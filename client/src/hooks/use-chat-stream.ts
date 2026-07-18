import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@shared/schema";

interface UseChatStreamOptions {
  language?: string;
  apiUrl?: string;
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  abort: () => void;
  error: string | null;
  clearMessages: () => void;
}

export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
  const { language = "english", apiUrl = "/api/chat-stream" } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setIsStreaming(true);

    // Add empty assistant message for streaming into
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                accumulated += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                  };
                  return updated;
                });
              } else if (data.type === "done") {
                // Final response confirmed
              } else if (data.type === "error") {
                throw new Error(data.message || "Stream error");
              }
            } catch (e) {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled - keep partial response
      } else {
        setError(err.message || "Something went wrong");
        // Remove empty assistant message on error
        setMessages(newMessages);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, language, apiUrl]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    isStreaming,
    abort,
    error,
    clearMessages,
  };
}
