import { Zap, Sparkles } from "lucide-react";
import { NepaliFlag } from "./nepali-flag";
import { SocialLinks } from "./social-links";
import { AnimatedLogo, MiniLogo } from "./animated-logo";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
  { label: "Media", href: "#media" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: settings } = useQuery<SiteSettings>({ 
    queryKey: ["/api/settings"] 
  });

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check if footer is published (default to showing if not set)
  if (settings?.publishFooter === false) {
    return null;
  }

  // Get footer contact info from settings or use defaults
  const footerEmail = settings?.footerContactEmail || "info@vyomai.cloud";
  const footerMobile = settings?.footerMobileNumber || "";
  const footerAddress = settings?.footerAddress || "Tokha, Kathmandu, Nepal";

  return (
    <footer className="relative py-12 border-t border-border" data-testid="footer">
      <div className="absolute inset-0 mandala-pattern opacity-5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AnimatedLogo variant="footer" showText={false} />
              <NepaliFlag className="w-4 h-6" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              VyomAi Cloud Pvt. Ltd is a startup company dedicated to AI technology research 
              and development, bringing intelligent solutions from Nepal to the world.
            </p>
            <SocialLinks />
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="grid grid-cols-2 gap-2">
              {footerLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 active:scale-95 transition-all duration-200 text-left relative inline-block hover-elevate"
                  data-testid={`link-footer-${link.label.toLowerCase()}`}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
                </button>
              ))}
            </nav>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p data-testid="text-footer-address">{footerAddress}</p>
              {footerMobile && (
                <a 
                  href={`tel:${footerMobile}`}
                  className="block hover:text-primary transition-colors"
                  data-testid="link-footer-mobile"
                >
                  {footerMobile}
                </a>
              )}
              <a 
                href={`mailto:${footerEmail}`}
                className="block hover:text-primary transition-colors"
                data-testid="link-footer-email"
              >
                {footerEmail}
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border">
          <div className="text-center mb-6 fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Solutions</span>
                <Zap className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Pioneering intelligent technology from Nepal</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <NepaliFlag className="w-3 h-4 animate-windy" /> Crafted in Kathmandu • Deployed Globally
            </p>
          </div>
          
          {/* Brand Showcase Section */}
          <div className="py-8 border-t border-border/50 flex flex-col items-center">
            <AnimatedLogo variant="brandShowcase" showText={true} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MiniLogo className="opacity-80" />
              <span>© {currentYear} VyomAi Cloud Pvt. Ltd. All rights reserved.</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transforming businesses with AI intelligence
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
