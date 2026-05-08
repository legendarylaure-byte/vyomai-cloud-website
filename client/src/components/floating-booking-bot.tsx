import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type SiteSettings } from "@shared/schema";

export function FloatingBookingBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyOrPersonal: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!settings?.bookingBotEnabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.companyOrPersonal) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/inquiries", {
        inquiryType: "booking",
        name: formData.name,
        email: formData.email,
        company: formData.companyOrPersonal,
        message: formData.message,
      });
      toast({ title: "Booking request sent successfully! We'll contact you soon." });
      setFormData({ name: "", email: "", companyOrPersonal: "", message: "" });
      setIsOpen(false);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send booking request. Please try again.";
      toast({ title: "Submission Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        isScrolled ? "bottom-8 right-8" : "bottom-4 right-4"
      }`}
    >
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-96 bg-background border border-border rounded-lg shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-2 glass-card"
          data-testid="booking-bot-form"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg gradient-text">Book Your AI Solution</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-booking"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

      <Button
        size="icon"
        className="rounded-full w-14 h-14 shadow-2xl"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-toggle-booking"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  );
}
