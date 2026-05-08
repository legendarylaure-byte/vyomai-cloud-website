import { useState, useEffect } from "react";
import { MessageCircle, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings, ChatMessage } from "@shared/schema";

interface FloatingWidgetsProps {
  onAIChatbotOpen?: (isOpen: boolean) => void;
}

export function FloatingWidgets({ onAIChatbotOpen }: FloatingWidgetsProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyOrPersonal: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Namaste! Welcome to VyomAi. I'm here to help you learn about our AI solutions and services. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const sendChatMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/chat", {
        messages: [...messages, userMessage],
      });
      // apiRequest already returns parsed JSON, so we use the response directly
      const data = response;
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I apologize, but I'm having trouble connecting right now. Details: ${error instanceof Error ? error.message : "Network error"}. Please try again or contact us at info@vyomai.cloud.`,
        },
      ]);
      console.error("Chatbot Client Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        isScrolled ? "bottom-8 right-8" : "bottom-4 right-4"
      }`}
    >
      {/* AI Chatbot Modal */}
      {aiOpen && (
        <div
          className="absolute bottom-20 right-0 w-96 bg-background border border-border rounded-lg shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-2 glass-card mb-2"
          data-testid="ai-chatbot-form"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              <span className="gradient-text">VyomAi Assistant</span>
            </h3>
            <button
              onClick={() => setAiOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-muted/30 rounded-lg h-80 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
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
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent/20 px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Ask about our AI solutions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                data-testid="input-chat-message"
                className="text-sm"
              />
              <Button
                size="icon"
                onClick={sendChatMessage}
                disabled={isLoading || !input.trim()}
                data-testid="button-send-chat"
                className="flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Bot Modal */}
      {bookingOpen && (
        <div
          className="absolute bottom-20 right-0 w-96 bg-background border border-border rounded-lg shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-2 glass-card mb-2"
          data-testid="booking-bot-form"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg gradient-text">Book Your AI Solution</h3>
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
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-submit-booking"
            >
              {isSubmitting ? "Sending..." : "Send Booking Request"}
            </Button>
          </form>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="flex gap-3 flex-col items-end">
        {/* AI Assistant Button */}
        <Button
          size="icon"
          variant="outline"
          className="rounded-full w-14 h-14 shadow-2xl bg-accent/20 border-accent/50 hover:bg-accent/30"
          onClick={() => setAiOpen(!aiOpen)}
          data-testid="button-toggle-ai-chat"
        >
          {aiOpen ? <X className="w-6 h-6 text-accent" /> : <Bot className="w-6 h-6 text-accent" />}
        </Button>

        {/* Booking Button */}
        {settings?.bookingBotEnabled !== false && (
          <Button
            size="icon"
            className="rounded-full w-14 h-14 shadow-2xl"
            onClick={() => setBookingOpen(!bookingOpen)}
            data-testid="button-toggle-booking"
          >
            {bookingOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </Button>
        )}
      </div>
    </div>
  );
}
