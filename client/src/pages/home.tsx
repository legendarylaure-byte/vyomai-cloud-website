import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { ServicesSection } from "@/components/services-section";
import { SolutionsSection } from "@/components/solutions-section";
import { MediaSection } from "@/components/media-section";
import { TeamSection } from "@/components/team-section";
import { PricingSection } from "@/components/pricing-section";
import { ContactSection } from "@/components/contact-section";
import { ConnectWithUs } from "@/components/connect-with-us";
import { Footer } from "@/components/footer";
import { FaqSection } from "@/components/faq-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { InteractiveAISection } from "@/components/interactive-ai-section";
import { ComingSoonModal } from "@/components/coming-soon-modal";
import { ScrollProgress } from "@/components/scroll-progress";
import { AIConsultant } from "@/components/ai-consultant";
import { OrbitalArc } from "@/components/orbital-arc";
import { SeoHead } from "@/components/seo-head";

import { type SiteSettings } from "@shared/schema";

export default function Home() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("vyomai-visited");
    if (!hasVisited) {
      fetch("/api/visitors/increment", { method: "POST" });
      sessionStorage.setItem("vyomai-visited", "true");
    }

    const comingSoonShown = sessionStorage.getItem("vyomai-coming-soon-shown");
    if (!comingSoonShown && settings?.comingSoonEnabled) {
      const timer = setTimeout(() => {
        setShowComingSoon(true);
        sessionStorage.setItem("vyomai-coming-soon-shown", "true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover)').matches;
    if (!canHover) return;

    const glow = glowRef.current;
    if (!glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      glow.style.opacity = "1";
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;

      // Update card-glow mouse tracking for all cards under cursor
      const cards = document.querySelectorAll('.card-glow, .card-hover-glow');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
      });
    };

    const handleMouseLeave = () => {
      glow.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const shouldShow = (setting: boolean | undefined) => {
    return !settingsLoading && setting !== false || settingsLoading;
  };

  return (
    <div className="min-h-screen noise-overlay cosmic-gradient-wrap">
      <SeoHead />
      <ScrollProgress />
      <Header />
      <main id="main-content">
        {shouldShow(settings?.showHomeSection) && <HeroSection />}
        {shouldShow(settings?.showAboutSection) && <AboutSection />}
        {shouldShow(settings?.showAboutSection) && <OrbitalArc />}
        {shouldShow(settings?.showServicesSection) && <ServicesSection />}
        {shouldShow(settings?.showServicesSection) && <OrbitalArc />}
        {shouldShow(settings?.showInteractiveAISection) && <InteractiveAISection />}
        {shouldShow(settings?.showInteractiveAISection) && <OrbitalArc />}
        {shouldShow(settings?.showSolutionsSection) && <SolutionsSection />}
        {shouldShow(settings?.showSolutionsSection) && <OrbitalArc />}
        {shouldShow(settings?.showTeamSection) && <TeamSection />}
        {shouldShow(settings?.showTeamSection) && <OrbitalArc />}
        {shouldShow(settings?.showPricingSection) && <PricingSection />}
        {shouldShow(settings?.showPricingSection) && <OrbitalArc />}
        {shouldShow(settings?.showMediaSection) && <MediaSection />}
        {shouldShow(settings?.showMediaSection) && <OrbitalArc />}
        {shouldShow(settings?.showContactSection) && <ContactSection />}
        {shouldShow(settings?.showTestimonialsSection) && <TestimonialsSection />}
        {shouldShow(settings?.showFaqSection) && <FaqSection />}
        {shouldShow(settings?.showFaqSection) && <OrbitalArc />}
        {shouldShow(settings?.showConnectWithUs) && <ConnectWithUs />}
      </main>
      <OrbitalArc />
      {!settingsLoading && <Footer />}
      <AIConsultant />
      <ComingSoonModal
        open={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title={settings?.comingSoonTitle || "Coming Soon!"}
        message={settings?.comingSoonMessage || "We are coming soon to share Knowledge and grow together. Stay tuned for exciting updates!"}
      />
      <div ref={glowRef} className="cursor-glow" style={{ position: "fixed", pointerEvents: "none", opacity: 0, zIndex: 100 }} aria-hidden="true" />
    </div>
  );
}
