import { useState, useEffect, useRef } from "react";
import { X, Languages, Check, Square, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useMagnetic } from "@/hooks/use-magnetic";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import type { SiteSettings } from "@shared/schema";

interface FloatingWidgetsProps {
  onAIChatbotOpen?: (isOpen: boolean) => void;
}

const greetings: Record<string, string> = {
  english: "Namaste! Welcome to VyomAi. I'm here to help you learn about our AI solutions and services. How can I assist you today?",
  nepali: "नमस्ते! VyomAi मा तपाईंलाई स्वागत छ। म तपाईंलाई हाम्रा AI समाधान र सेवाहरूको बारेमा जानकारी दिन यहाँ छु। आज म तपाईंलाई कसरी सहायता गर्न सक्छु?",
  hindi: "नमस्ते! VyomAi में आपका स्वागत है। मैं आपको हमारे AI समाधानों और सेवाओं के बारे में जानकारी देने के लिए यहाँ हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?",
};

const languages = [
  { key: "english", label: "English", flag: "\u{1F1FA}\u{1F1F3}" },
  { key: "nepali", label: "\u0928\u0947\u092A\u093E\u0932\u0940", flag: "\u{1F1F3}\u{1F1F5}" },
  { key: "hindi", label: "\u0939\u093F\u0928\u094D\u0926\u0940", flag: "\u{1F1EE}\u{1F1F3}" },
];

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="12" cy="14" r="2.5" />
      <line x1="9.8" y1="9.5" x2="11" y2="12" />
      <line x1="14.2" y1="9.5" x2="13" y2="12" />
      <line x1="8" y1="10.5" x2="8" y2="12.5" />
      <line x1="16" y1="10.5" x2="16" y2="12.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <path d="M18.5 2.5l1.5 1.5" strokeWidth="1.5" />
      <path d="M20 2.5l-1.5 1.5" strokeWidth="1.5" />
      <circle cx="17.5" cy="5" r="3" fill="none" strokeWidth="1.5" />
      <path d="M16.2 4.3l0.8 0.8 1.8-1.6" strokeWidth="1.3" />
    </svg>
  );
}

export function FloatingWidgets({ onAIChatbotOpen }: FloatingWidgetsProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("vyomai-chat-lang") || "english");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Coordinate body scroll lock with other modals
  useEffect(() => {
    if (aiOpen || bookingOpen) {
      lockScroll();
      return () => unlockScroll();
    }
  }, [aiOpen, bookingOpen]);

  // Back-to-top visibility and dock scroll state
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyOrPersonal: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const initialMessage = greetings[localStorage.getItem("vyomai-chat-lang") || "english"];
  const { messages, sendMessage, isLoading, isStreaming, abort } = useChatStream({ language });

  // Initialize with greeting if no messages
  const displayMessages = messages.length === 0
    ? [{ role: "assistant" as const, content: initialMessage }]
    : messages;

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.companyOrPersonal) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/bookings", formData);
      toast({ title: "Booking request sent successfully! We'll contact you soon." });
      setFormData({ name: "", email: "", companyOrPersonal: "", message: "" });
      setBookingOpen(false);
    } catch (error) {
      toast({ title: "Failed to send booking request", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("vyomai-chat-lang", lang);
    setLangDropdownOpen(false);
    document.documentElement.lang = lang === "nepali" ? "ne" : lang === "hindi" ? "hi" : "en";
  };

  const sendChatMessage = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  return (
    <>
      {/* Dock Container — desktop: vertical pill middle-right, mobile: horizontal pill bottom-right */}
      <div
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 vyom-dock signal-trace"
      >
        <div className="dock-buttons">
          {/* AI Chat Button */}
          <DockButtonMagnetic>
            <button
              className={`dock-btn dock-btn-ai ${aiOpen ? "active" : ""}`}
              onClick={() => { setAiOpen(!aiOpen); setBookingOpen(false); }}
              aria-label="AI Chat Assistant"
              data-testid="button-toggle-ai-chat"
            >
              <span className="dock-btn-icon">
                {aiOpen ? <X className="w-4 h-4" /> : <BrainIcon />}
              </span>
            </button>
            <span className="dock-tooltip">AI Chat</span>
          </DockButtonMagnetic>

          {/* Booking Button */}
          {settings?.bookingBotEnabled !== false && (
            <DockButtonMagnetic>
              <button
                className={`dock-btn dock-btn-booking ${bookingOpen ? "active" : ""}`}
                onClick={() => { setBookingOpen(!bookingOpen); setAiOpen(false); }}
                aria-label="Book a Meeting"
                data-testid="button-toggle-booking"
              >
                <span className="dock-btn-icon">
                  {bookingOpen ? <X className="w-4 h-4" /> : <CalendarIcon />}
                </span>
              </button>
              <span className="dock-tooltip">Book a Meeting</span>
            </DockButtonMagnetic>
          )}

          {/* Back to Top Button — visible after scrolling */}
          {showBackToTop && (
            <DockButtonMagnetic>
              <button
                className="dock-btn dock-btn-top"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
              >
                <span className="dock-btn-icon">
                  <ArrowUp className="w-4 h-4" />
                </span>
              </button>
              <span className="dock-tooltip">Back to Top</span>
            </DockButtonMagnetic>
          )}
        </div>
      </div>

      {/* AI Chat Modal — desktop: left of dock, mobile: bottom sheet */}
      {aiOpen && (
        <div className="vyom-chat-modal" data-testid="ai-chatbot-form">
          <div className="vyom-chat-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="text-primary"><BrainIcon /></span>
                <span className="gradient-brand-text">VyomAi Assistant</span>
              </h3>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent/20 transition-colors"
                    title="Change language"
                    aria-label="Change language"
                    aria-expanded={langDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                  {langDropdownOpen && (
                    <div
                      className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg shadow-xl p-1.5 min-w-[140px] z-50"
                      role="listbox"
                      aria-label="Select language"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.key}
                          onClick={() => switchLanguage(lang.key)}
                          role="option"
                          aria-selected={language === lang.key}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                            language === lang.key
                              ? "bg-accent/20 text-accent font-medium"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                          {language === lang.key && <Check className="w-3.5 h-3.5 ml-auto text-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setAiOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-close-chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg h-80 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {displayMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground rounded-br-none"
                          : "bg-accent/20 text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {isStreaming && i === displayMessages.length - 1 && msg.role === "assistant" && (
                        <span className="streaming-cursor" />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  placeholder={language === "nepali" ? "\u0939\u093E\u092E\u094D\u0930\u093E AI \u0938\u092E\u093E\u0927\u093E\u0928\u0939\u0930\u0942\u0915\u094B \u092C\u093E\u0930\u0947\u092E\u093E \u0938\u094B\u0927\u094D\u0928\u0941\u0939\u094B\u0938\u094D..." : language === "hindi" ? "\u0939\u092E\u093E\u0930\u0947 AI \u0938\u092E\u093E\u0927\u093E\u0928\u094B\u0902 \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u092A\u0942\u091B\u0947\u0902..." : "Ask about our AI solutions..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  data-testid="input-chat-message"
                  className="text-sm"
                />
                {isStreaming ? (
                  <Button
                    size="icon"
                    onClick={abort}
                    variant="destructive"
                    className="flex-shrink-0"
                    aria-label="Stop generating"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={sendChatMessage}
                    disabled={isLoading || !input.trim()}
                    data-testid="button-send-chat"
                    className="flex-shrink-0"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal — desktop: left of dock, mobile: bottom sheet */}
      {bookingOpen && (
        <div className="vyom-chat-modal" data-testid="booking-bot-form">
          <div className="vyom-chat-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg gradient-brand-text">Book Your AI Solution</h3>
              <button
                onClick={() => setBookingOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-booking"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  data-testid="input-booking-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  data-testid="input-booking-email"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Company / Personal *</label>
                <Input
                  value={formData.companyOrPersonal}
                  onChange={(e) => setFormData({ ...formData, companyOrPersonal: e.target.value })}
                  placeholder="Company name or your name"
                  data-testid="input-booking-company"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your project..."
                  className="min-h-20"
                  data-testid="input-booking-message"
                />
              </div>

              <Button
                type="submit"
                className="w-full admin-btn-glow"
                disabled={isSubmitting}
                data-testid="button-submit-booking"
              >
                {isSubmitting ? "Sending..." : "Send Booking Request"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function DockButtonMagnetic({ children }: { children: React.ReactNode }) {
  const { ref, handleMouseMove, handleMouseLeave } = useMagnetic({ strength: 0.25, range: 80 });

  return (
    <div
      ref={ref}
      className="dock-btn-wrap magnetic-hover"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
