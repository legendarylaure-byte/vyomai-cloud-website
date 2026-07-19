import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

const suggestions = [
  { text: "What services do you offer?", section: "services" },
  { text: "Show me pricing plans", section: "pricing" },
  { text: "Meet the team", section: "team" },
  { text: "How can AI help my business?", section: "about" },
  { text: "Contact information", section: "contact" },
];

// Module-level state for opening search from header
let globalSetOpen: ((open: boolean) => void) | null = null;

export function openGlobalSearch(e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (globalSetOpen) {
    globalSetOpen(true);
  } else {
    // Fallback: dispatch custom event that SmartSearchModal listens to
    window.dispatchEvent(new CustomEvent("vyomai-open-search"));
  }
}

export function SmartSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Register global opener — set immediately, not just in effect
  useEffect(() => {
    globalSetOpen = setIsOpen;
    return () => { globalSetOpen = null; };
  }, []);

  // Fallback listener for custom event
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("vyomai-open-search", handler);
    return () => window.removeEventListener("vyomai-open-search", handler);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, []);

  useEffect(() => {
    if (isOpen) {
      lockScroll();
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 100);
      return () => {
        unlockScroll();
        setQuery("");
        // Don't restore focus — it causes scroll jumps to the previously focused element
      };
    }
  }, [isOpen]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen) return;
    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !(el as HTMLInputElement).disabled && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleTrap);
    return () => document.removeEventListener("keydown", handleTrap);
  }, [isOpen]);

  // Brief brand gradient border flash on a section element
  const highlightSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.style.boxShadow;
    el.style.boxShadow = "inset 0 0 0 2px rgba(138, 80, 232, 0.6), 0 0 20px rgba(138, 80, 232, 0.15)";
    el.style.transition = "box-shadow 0.3s ease";
    setTimeout(() => {
      el.style.boxShadow = prev;
      setTimeout(() => { el.style.transition = ""; }, 300);
    }, 1500);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/ai/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      const section = data.section || "home";

      setIsOpen(false);

      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          highlightSection(section);
        }
      }, 350);
    } catch (error) {
      const lower = searchQuery.toLowerCase();
      let section = "home";
      if (lower.includes("service")) section = "services";
      else if (lower.includes("price") || lower.includes("plan")) section = "pricing";
      else if (lower.includes("team")) section = "team";
      else if (lower.includes("contact")) section = "contact";
      else if (lower.includes("faq") || lower.includes("question")) section = "faq";
      else if (lower.includes("testimonial") || lower.includes("review")) section = "testimonials";
      else if (lower.includes("about")) section = "about";
      else if (lower.includes("media") || lower.includes("blog") || lower.includes("article")) section = "media";
      else if (lower.includes("solution")) section = "solutions";

      setIsOpen(false);
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          highlightSection(section);
        }
      }, 350);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleSuggestionClick = (section: string) => {
    setIsOpen(false);
    setTimeout(() => {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        highlightSection(section);
      }
    }, 350);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            ref={modalRef}
            role="dialog"
            aria-label="Smart Search"
            aria-modal="true"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg smart-search-modal"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                {isSearching ? (
                   <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search or ask anything about VyomAi..."
                  className="flex-1 bg-transparent text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 input-focus-glow"
                  disabled={isSearching}
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!query && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Quick navigation
                  </p>
                  <div className="space-y-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s.section)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 text-sm text-foreground transition-colors group"
                      >
                        <span>{s.text}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SearchTrigger({ className = "" }: { className?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => openGlobalSearch(e)}
      className={`header-icon-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
        className || "text-foreground/70 hover:text-foreground hover:bg-muted/50"
      }`}
      aria-label="Search website (Cmd+K)"
      data-testid="button-search"
    >
      <Search className="w-4 h-4" />
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] text-muted-foreground bg-muted/50 rounded border border-border/50">
        <span className="text-xs">⌘</span>K
      </kbd>
    </motion.button>
  );
}
