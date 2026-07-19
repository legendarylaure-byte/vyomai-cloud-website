import { Zap, Sparkles } from "lucide-react";
import { NepaliFlag } from "./nepali-flag";
import { SocialLinks } from "./social-links";
import { AnimatedLogo, MiniLogo } from "./animated-logo";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MagneticWrapper } from "@/components/magnetic-wrapper";
import { useLocation } from "wouter";
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

const legalLinks = [
  { label: "Terms of Service", path: "/terms" },
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Cookie Policy", path: "/cookies" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] } },
};

const linkVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } },
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"]
  });
  const [, setLocation] = useLocation();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navigateToPage = (path: string) => {
    setLocation(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerEmail = settings?.footerContactEmail || "info@vyomai.cloud";
  const footerMobile = settings?.footerMobileNumber || "";
  const footerAddress = settings?.footerAddress || "Tokha, Kathmandu, Nepal";

  return (
    <footer className="relative py-24 overflow-hidden" role="contentinfo" data-testid="footer">
      {/* Mandala pattern background */}
      <div className="absolute inset-0 mandala-pattern mandala-rotate opacity-[0.04]" />

      {/* Brand glow orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-brand-start/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-brand-mid/6 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-5%" }}
      >
        {/* Top section with brand */}
        <motion.div className="mb-12" variants={itemVariants}>
          <div className="flex items-center gap-4 mb-6">
            <AnimatedLogo variant="footer" showText={false} />
            <NepaliFlag className="w-5 h-7 animate-windy" />
          </div>
          <p className="text-base text-foreground/60 leading-relaxed max-w-2xl">
            VyomAi Cloud Pvt. Ltd is an AI technology company dedicated to research
            and development, bringing intelligent solutions from Nepal to the world.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Quick Links — spans 4 cols */}
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold mb-5 text-foreground text-sm uppercase tracking-wider">Quick Links</h4>
            <motion.nav
              className="grid grid-cols-2 gap-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {footerLinks.map((link) => (
                <motion.div key={link.href} variants={linkVariants}>
                  <MagneticWrapper strength={0.2}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm text-foreground/50 hover:text-foreground hover:translate-x-1 active:scale-95 transition-all duration-200 text-left w-full min-h-[44px] flex items-center"
                      aria-label={`Navigate to ${link.label}`}
                      data-testid={`link-footer-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </button>
                  </MagneticWrapper>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>

          {/* Contact — spans 4 cols */}
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold mb-5 text-foreground text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-3 text-sm text-foreground/50">
              <p data-testid="text-footer-address">{footerAddress}</p>
              {footerMobile && (
                <a
                  href={`tel:${footerMobile}`}
                  className="block hover:text-foreground transition-colors"
                  data-testid="link-footer-mobile"
                >
                  {footerMobile}
                </a>
              )}
              <a
                href={`mailto:${footerEmail}`}
                className="block hover:text-foreground transition-colors"
                data-testid="link-footer-email"
              >
                {footerEmail}
              </a>
            </div>
          </motion.div>

          {/* Social + CTA — spans 4 cols */}
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold mb-5 text-foreground text-sm uppercase tracking-wider">Connect</h4>
            <SocialLinks />
            <motion.div
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/5 border border-border/10"
              whileHover={{ scale: 1.05, borderColor: "rgba(138,80,232,0.3)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Sparkles className="w-4 h-4 text-brand-start" />
              <span className="text-sm text-foreground/60">AI-Powered Solutions</span>
            </motion.div>
          </motion.div>

          {/* Legal — spans 4 cols */}
          <motion.div variants={itemVariants}>
            <h4 className="font-semibold mb-5 text-foreground text-sm uppercase tracking-wider">Legal</h4>
            <motion.nav
              className="grid grid-cols-1 gap-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {legalLinks.map((link) => (
                <motion.div key={link.path} variants={linkVariants}>
                  <MagneticWrapper strength={0.2}>
                    <button
                      onClick={() => navigateToPage(link.path)}
                      className="text-sm text-foreground/50 hover:text-foreground hover:translate-x-1 active:scale-95 transition-all duration-200 text-left w-full"
                      aria-label={link.label}
                    >
                      {link.label}
                    </button>
                  </MagneticWrapper>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="pt-8 border-t border-border/5"
          variants={itemVariants}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-foreground/50">
              <MiniLogo className="opacity-80" />
              <span>© {currentYear} VyomAi Cloud Pvt. Ltd. All rights reserved.</span>
            </div>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-card/5 border border-border/10"
              whileHover={{ scale: 1.05, borderColor: "rgba(138,80,232,0.3)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <NepaliFlag className="w-4 h-5 animate-windy" />
              <span className="text-xs text-foreground/50">Crafted in Kathmandu · Deployed Globally</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
