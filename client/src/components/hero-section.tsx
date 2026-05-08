import { ArrowDown, Zap, Globe, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface HeroContent {
  id: string;
  badgeText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundStyle: string;
  enabled: boolean;
}

export function HeroSection() {
  const { data: heroData } = useQuery<{ content: HeroContent | null }>({
    queryKey: ["/api/content/hero"],
  });

  const content = heroData?.content;

  const handleNavigation = (href: string) => {
    if (!href) return;
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/')) {
      window.location.href = href;
    } else {
      const element = document.querySelector(`#${href}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (content?.enabled === false) {
    return null;
  }

  const badgeText = content?.badgeText || "Pioneering AI Solutions from Nepal";
  const titleLine1 = content?.titleLine1 || "Transform Your";
  const titleLine2 = content?.titleLine2 || "Business with AI";
  const subtitle = content?.subtitle || "We build intelligent AI agents and seamlessly integrate with Google, Microsoft, and enterprise platforms. Share knowledge, empower your team, and grow together.";
  const primaryButtonText = content?.primaryButtonText || "Get Started";
  const primaryButtonLink = content?.primaryButtonLink || "#contact";
  const secondaryButtonText = content?.secondaryButtonText || "Explore Services";
  const secondaryButtonLink = content?.secondaryButtonLink || "#services";

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 particle-bg" />
      <div className="absolute inset-0 mandala-pattern opacity-30" />
      
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">{badgeText}</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-[Space_Grotesk]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="gradient-text">{titleLine1}</span>
          <br />
          <span className="text-foreground">{titleLine2}</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {subtitle}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Button
            size="lg"
            className="px-8 py-6 text-lg rounded-xl"
            onClick={() => handleNavigation(primaryButtonLink)}
            data-testid="button-get-started"
          >
            <Bot className="w-5 h-5 mr-2" />
            {primaryButtonText}
          </Button>
          {secondaryButtonText && (
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
              onClick={() => handleNavigation(secondaryButtonLink)}
              data-testid="button-explore-services"
            >
              <Globe className="w-5 h-5 mr-2" />
              {secondaryButtonText}
            </Button>
          )}
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {[
            { value: "50+", label: "AI Agents" },
            { value: "100%", label: "Nepal Based" },
            { value: "24/7", label: "Support" },
            { value: "Global", label: "Reach" },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-card rounded-xl p-4 text-center hover-elevate"
            >
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <button
          onClick={() => handleNavigation("#about")}
          className="p-3 glass rounded-full hover-elevate animate-bounce"
          aria-label="Scroll to about section"
        >
          <ArrowDown className="w-5 h-5 text-primary" />
        </button>
      </motion.div>
    </section>
  );
}
