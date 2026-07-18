import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTyping } from "@/hooks/use-typing";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

const quickPrompts = [
  "How can AI help my restaurant?",
  "I run a small e-commerce store",
  "My team wastes time on manual data entry",
  "I want to understand my customers better",
];

interface StreamMessage {
  role: "user" | "assistant";
  content: string;
}

// Global state for opening from hero button
let globalConsultantOpen: ((open: boolean) => void) | null = null;

export function openGlobalConsultant() {
  if (globalConsultantOpen) {
    globalConsultantOpen(true);
  } else {
    window.dispatchEvent(new CustomEvent("vyomai-open-consultant"));
  }
}

export function AIConsultant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const typingPlaceholder = useTyping({
    texts: [
      "How can AI help my restaurant?",
      "What about e-commerce automation?",
      "Help with data entry automation?",
      "Customer insights for my business?",
    ],
    typeSpeed: 60,
    deleteSpeed: 30,
    pauseDuration: 1500,
  });

  // Register global opener
  useEffect(() => {
    globalConsultantOpen = setIsOpen;
    return () => { globalConsultantOpen = null; };
  }, []);

  // Fallback listener
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("vyomai-open-consultant", handler);
    return () => window.removeEventListener("vyomai-open-consultant", handler);
  }, []);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Focus trap inside modal
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    panel.addEventListener("keydown", handler);
    return () => panel.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Lock body scroll when modal is open (coordinated via scroll-lock lib)
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      return () => unlockScroll();
    }
  }, [isOpen]);

  const sendConsult = async (message: string) => {
    if (!message.trim() || isStreaming) return;

    const userMsg: StreamMessage = { role: "user", content: message.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/ai/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) throw new Error("Failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

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
                  updated[updated.length - 1] = { role: "assistant", content: accumulated };
                  return updated;
                });
              }
            } catch (e) { /* skip malformed */ }
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I apologize, I'm having trouble connecting. Please try again or contact us at info@vyomai.cloud.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendConsult(input);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="consultant-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel — fixed container for centering, inner motion for animation */}
          <div
            key="consultant-position"
            className="z-[55] ai-consultant-desktop"
          >
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="ai-consultant-panel flex flex-col h-full w-full"
              role="dialog"
              aria-modal="true"
              aria-label="AI Business Consultant"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Business Consultant</p>
                  <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Close consultant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Quick questions:</p>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendConsult(prompt)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm text-foreground transition-colors border border-border/30 hover:border-primary/30"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-muted/50 text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                      <span className="streaming-cursor" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30 flex gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={input ? "" : `${typingPlaceholder}...`}
                disabled={isStreaming}
                className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors input-focus-glow"
              />
              {isStreaming ? (
                <button
                  onClick={() => setIsStreaming(false)}
                  className="px-3 py-2.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                  aria-label="Stop generating"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </button>
              ) : (
                <button
                  onClick={() => sendConsult(input)}
                  disabled={!input.trim() || isStreaming}
                  className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
