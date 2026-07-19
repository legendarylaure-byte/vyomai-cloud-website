import { useState, useEffect, useCallback } from "react";
import { Menu, X, Sun, Moon, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NepaliFlag } from "./nepali-flag";
import { AnimatedLogo } from "./animated-logo";
import { SocialLinks } from "./social-links";
import { SearchTrigger } from "./smart-search";
import { useTheme } from "./theme-provider";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "Team", href: "#team" },
  { label: "Pricing", href: "#pricing" },
  { label: "Media", href: "#media" },
  { label: "Contact", href: "#contact" },
];

const sectionIds = navLinks.map((l) => l.href.replace("#", ""));

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverHero, setIsOverHero] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      setIsOverHero(y < window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveSection(entry.target.id);
      }
    }
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(handleIntersection, {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      });
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [handleIntersection]);

  // Escape key to close mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobileMenuOpen]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        isScrolled ? "pt-3" : "pt-0"
      }`}
      data-testid="header"
    >
      {/* Floating Pill Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700">
        <div
          className={`flex items-center justify-between gap-4 rounded-2xl px-4 transition-all duration-500 ${
            isScrolled ? "h-14" : "h-16"
          } ${
            isScrolled
              ? isOverHero
                ? "bg-white/10 backdrop-blur-md border border-white/10 shadow-lg"
                : "glass border border-black/5 dark:border-white/8 shadow-lg"
              : "bg-transparent"
          }`}
        >
          {/* Logo */}
          <button
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label="Go to homepage"
          >
            <AnimatedLogo variant="header" showText={true} />
            <NepaliFlag className="w-5 h-7 animate-windy" />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.replace("#", "");
              return (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={`nav-link px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl relative ${
                    isActive
                      ? isOverHero
                        ? "text-white bg-white/10 nav-link-active"
                        : "text-primary gradient-brand-subtle nav-link-active"
                      : isOverHero
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                  }`}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`hidden md:flex items-center gap-2 ${isOverHero ? "text-white" : ""}`}>
              <SocialLinks />
            </div>

            <div className="header-tooltip-wrap" data-tooltip="Search">
              <SearchTrigger className={isOverHero ? "text-white/80 hover:text-white hover:bg-white/10" : ""} />
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="header-tooltip-wrap"
              data-tooltip="Admin"
            >
              <Button
                variant="outline"
                size="icon"
                asChild
                data-testid="button-admin-login"
                className={`header-icon-btn rounded-xl ${isOverHero ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : ""}`}
              >
                <a href="/admin" aria-label="Admin Login">
                  <LogIn className="w-4 h-4" />
                </a>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="header-tooltip-wrap"
              data-tooltip="Email"
            >
              <Button
                size="icon"
                asChild
                data-testid="button-email-login"
                className={`header-icon-btn rounded-xl ${isOverHero ? "bg-white/10 text-white hover:bg-white/20 border-white/20" : ""}`}
              >
                <a
                  href="https://accounts.zoho.com/signin"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Email Login"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="header-tooltip-wrap"
              data-tooltip="Theme"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                className={`header-icon-btn rounded-xl ${isOverHero ? "text-white hover:bg-white/10" : ""}`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </motion.div>

            {/* Hamburger with morph animation */}
            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden rounded-xl ${isOverHero ? "text-white hover:bg-white/10" : ""}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              data-testid="button-mobile-menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="lg:hidden overflow-hidden"
          >
            <div className="glass mx-4 mt-2 rounded-2xl border border-white/10 dark:border-white/10 border-black/5 p-4" role="dialog" aria-modal="true" aria-label="Mobile navigation">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className={`px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-300 ${
                      activeSection === link.href.replace("#", "")
                        ? "text-primary gradient-brand-subtle"
                        : isOverHero
                          ? "text-white/80 hover:text-white hover:bg-white/10"
                          : "text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
              <div className={`flex items-center justify-between pt-4 border-t mt-4 ${isOverHero ? "border-white/10" : "border-black/5 dark:border-white/10"}`}>
                <SocialLinks />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
