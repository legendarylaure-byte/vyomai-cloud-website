import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Namaste! Welcome to VyomAi. I'm here to help you learn about our AI solutions and services. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiRequest("POST", "/api/chat", {
        messages: [...messages, userMessage],
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I apologize, but I'm having trouble connecting right now. Error Details: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Button
        size="icon"
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl z-50 transition-all duration-300 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={() => setIsOpen(true)}
        data-testid="button-open-chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse" />
      </Button>

      <div
        className={`fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-96px)] glass-card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
        data-testid="chat-window"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">VyomAi Assistant (v1.1 Debug)</h3>
              <p className="text-xs text-muted-foreground">AI-powered support</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-chat"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-primary/20"
                      : "bg-accent/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                  data-testid={`chat-message-${index}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about our AI services..."
              disabled={isLoading}
              className="flex-1"
              data-testid="input-chat"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              data-testid="button-send-chat"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by VyomAi
          </p>
        </div>
      </div>
    </>
  );
}
