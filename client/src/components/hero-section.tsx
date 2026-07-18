import { useEffect, useRef, useState, useMemo } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { openGlobalConsultant } from "@/components/ai-consultant";
import { FloatingParticles } from "@/components/floating-particles";


export function HeroSection() {
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const titleWords = useMemo(() => [
    { text: "AI", gradient: false },
    { text: "Solutions", gradient: false },
    { text: "from", gradient: false },
    { text: "Nepal", gradient: true },
    { text: "to", gradient: true },
    { text: "the", gradient: true },
    { text: "World", gradient: true },
  ], []);

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, window.innerHeight * 0.4], [1, 0]);
  const scale = useTransform(scrollY, [0, window.innerHeight * 0.4], [1, 0.95]);

  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (!starsRef.current) { rafId = null; return; }
        const x = ((e.clientX / window.innerWidth) - 0.5) * 40;
        const y = ((e.clientY / window.innerHeight) - 0.5) * 22;
        starsRef.current.style.transform = `translate(${x}px, ${y}px)`;
        rafId = null;
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const wordmark = wordmarkRef.current;
    if (wordmark) {
      const text = wordmark.textContent?.trim() || "VyomAi Cloud";
      wordmark.innerHTML = "";
      [...text].forEach((char, index) => {
        const wrapper = document.createElement("span");
        wrapper.className = "letter-wrapper";
        const inner = document.createElement("span");
        inner.textContent = char === " " ? "\u00A0" : char;
        inner.className = "letter-inner";
        inner.style.animationDelay = `${1.8 + index * 0.06}s`;
        wrapper.appendChild(inner);
        wordmark.appendChild(wrapper);
      });
    }
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="hero-loopstack"
      aria-label="Hero section"
      data-testid="section-hero"
    >
      {/* Background video */}
      <div className="hero-video-container">
        <video autoPlay muted loop playsInline preload="metadata" onCanPlay={() => setVideoLoaded(true)} poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%230D0B1A' width='100%25' height='100%25'%3E%3C/rect%3E%3C/svg%3E">
          <source
            src="https://api.getlayers.ai/storage/v1/object/public/public/assets/loopstack-f8c64439bf/flower.mp4"
            type="video/mp4"
          />
        </video>
        {/* Shimmer loading overlay */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-1000 ${videoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          style={{ background: 'linear-gradient(135deg, #0D0B1A 0%, #1E1548 40%, #0D0B1A 60%, #1A1040 100%)', backgroundSize: '400% 400%', animation: 'hero-shimmer 2s ease-in-out infinite' }}
          aria-hidden="true"
        />
      </div>

      {/* Cosmic gradient overlay */}
      <div className="hero-cosmic-bg" aria-hidden="true" />

      {/* Twinkling star particles */}
      <div className="hero-stars" ref={starsRef} aria-hidden="true" />

      {/* Shooting stars / comets */}
      <div className="hero-comets" aria-hidden="true">
        <div className="hero-comet hero-comet-1" />
        <div className="hero-comet hero-comet-2" />
        <div className="hero-comet hero-comet-3" />
      </div>

      {/* Brand-colored twinkling stars */}
      <div className="hero-brand-star hero-brand-star-1" aria-hidden="true" />
      <div className="hero-brand-star hero-brand-star-2" aria-hidden="true" />
      <div className="hero-brand-star hero-brand-star-3" aria-hidden="true" />

      {/* Floating ambient particles */}
      <FloatingParticles count={15} />

      {/* Title — top center */}
      <motion.div className="hero-content" style={{ opacity, scale }}>
        <h1 className="hero-title-loopstack">
          {titleWords.map((w, i) => (
            <span key={i} className="word-wrapper">
              <span
                className={`word-inner${w.gradient ? " gradient-brand-text" : ""}`}
                style={{ animationDelay: `${0.3 + i * 0.18}s` }}
              >
                {w.text}
              </span>
            </span>
          ))}
        </h1>
      </motion.div>

      {/* CTA area — bottom left */}
      <motion.div className="hero-cta-area" style={{ opacity, scale }}>
        <div className="hero-tagline">
          <h2 className="hero-tagline-heading">
            Transform Your Business with AI
          </h2>
          <p className="hero-tagline-desc">
            We build intelligent AI agents and seamlessly integrate with Google, Microsoft, and enterprise platforms. Share knowledge, empower your team, and grow together.
          </p>
        </div>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => openGlobalConsultant()}
          className="hero-btn-loopstack ai-consultant-trigger group"
          aria-label="Open AI Business Consultant"
          data-testid="button-ai-consultant"
        >
          <span className="ai-consultant-icon-wrap">
            <Sparkles className="w-5 h-5 text-white" />
          </span>
          <span className="shiny-white-text">AI Business Consultant</span>
          <span className="ai-pulse-dot" />
        </motion.button>
      </motion.div>

      {/* Wordmark — bottom center */}
      <motion.div className="hero-wordmark-wrap" style={{ opacity, scale }}>
        <span ref={wordmarkRef} className="hero-wordmark-text" aria-label="VyomAi Cloud">
          VyomAi Cloud
        </span>
      </motion.div>

      {/* Scroll-down indicator */}
      <div
        className="scroll-indicator"
        style={{ position: "absolute", bottom: "10vh", left: "50%", transform: "translateX(-50%)" }}
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/40 font-medium tracking-wider uppercase">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-primary to-accent"
              animate={{
                y: [0, 12, 0],
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom fade into first section */}
      <div className="hero-bottom-fade" aria-hidden="true" />
    </section>
  );
}
