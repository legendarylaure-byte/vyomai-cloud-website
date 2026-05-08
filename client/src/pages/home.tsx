import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { ServicesSection } from "@/components/services-section";
import { SolutionsSection } from "@/components/solutions-section";
import { MediaSection } from "@/components/media-section";
import { TeamSection } from "@/components/team-section";
import { PricingSection } from "@/components/pricing-section";
import { ProjectDiscussionSection } from "@/components/project-discussion-section";
import { ContactSection } from "@/components/contact-section";
import { ConnectWithUs } from "@/components/connect-with-us";
import { Footer } from "@/components/footer";
import { ComingSoonModal } from "@/components/coming-soon-modal";
import { FloatingWidgets } from "@/components/floating-widgets";
import { type SiteSettings } from "@shared/schema";

export default function Home() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("vyomai-visited");
    if (!hasVisited) {
      fetch("/api/visitors/increment", { method: "POST" });
      sessionStorage.setItem("vyomai-visited", "true");
    }

    // Show coming soon modal once on page load if enabled
    const comingSoonShown = sessionStorage.getItem("vyomai-coming-soon-shown");
    if (!comingSoonShown && settings?.comingSoonEnabled) {
      const timer = setTimeout(() => {
        setShowComingSoon(true);
        sessionStorage.setItem("vyomai-coming-soon-shown", "true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  // Show all sections during loading to maintain UX, hide them based on loaded settings
  const shouldShow = (setting: boolean | undefined) => {
    return !settingsLoading && setting !== false || settingsLoading; // Show during loading, then respect setting
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        {shouldShow(settings?.showAboutSection) && <AboutSection />}
        {shouldShow(settings?.showServicesSection) && <ServicesSection />}
        {shouldShow(settings?.showSolutionsSection) && <SolutionsSection />}
        {shouldShow(settings?.showTeamSection) && <TeamSection />}
        {shouldShow(settings?.showPricingSection) && <PricingSection />}
        {shouldShow(settings?.showMediaSection) && <MediaSection />}
        {shouldShow(settings?.showProjectDiscussionSection) && <ProjectDiscussionSection />}
        {shouldShow(settings?.showContactSection) && <ContactSection />}
        <ConnectWithUs />
      </main>
      {!settingsLoading && <Footer />}
      <FloatingWidgets />
      <ComingSoonModal
        open={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title={settings?.comingSoonTitle || "Coming Soon!"}
        message={settings?.comingSoonMessage || "We are coming soon to share Knowledge and grow together. Stay tuned for exciting updates!"}
      />
    </div>
  );
}
