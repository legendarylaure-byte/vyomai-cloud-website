import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NepaliFlag } from "./nepali-flag";
import { AnimatedLogo } from "./animated-logo";
import { SocialLinks } from "./social-links";
import { useTheme } from "./theme-provider";
import { motion } from "framer-motion";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "Media", href: "#media" },
  { label: "Contact", href: "#contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
          : "bg-transparent"
        }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2">
            <AnimatedLogo variant="header" showText={false} />
            <NepaliFlag className="w-5 h-7 animate-windy" />
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="nav-link px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary active:scale-95 transition-all duration-300 rounded-lg hover-elevate"
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <SocialLinks />
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="button-admin-login"
              >
                <a href="/admin">
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin
                </a>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="sm"
                asChild
                data-testid="button-email-login"
              >
                <a 
                  href="https://accounts.zoho.com/signin" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </a>
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="px-4 py-3 text-left text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
              <SocialLinks />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
