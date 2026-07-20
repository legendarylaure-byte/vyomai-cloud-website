import { useQuery } from "@tanstack/react-query";
import { type SiteSettings } from "@shared/schema";
import { Linkedin, Instagram, Facebook, Youtube, MessageCircle, Phone, Globe } from "lucide-react";
import { SiWhatsapp, SiViber } from "react-icons/si";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-6 h-6" />,
  instagram: <Instagram className="w-6 h-6" />,
  facebook: <Facebook className="w-6 h-6" />,
  youtube: <Youtube className="w-6 h-6" />,
  whatsapp: <SiWhatsapp className="w-6 h-6" />,
  viber: <SiViber className="w-6 h-6" />,
};

const PLATFORM_NAMES: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  viber: "Viber",
};

function formatCount(count: string | number) {
  const num = typeof count === 'string' ? parseInt(count.replace(/,/g, '')) : count;
  if (isNaN(num)) return count;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

export function ConnectWithUs() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: integrations = [] } = useQuery<any[]>({
    queryKey: ["/api/integrations"],
  });

  if (!settings) return null;

  const platforms = integrations.map(i => ({
    key: i.platform,
    label: PLATFORM_NAMES[i.platform] || i.platform,
    url: settings.socialLinks?.[i.platform as keyof typeof settings.socialLinks] || i.profileUrl,
    followers: i.analytics?.followersCount || "0",
    isConnected: i.isConnected
  })).filter(p => p.url);

  return (
    <section id="connect" className="pb-20 pt-16 sm:pt-24 section-a tint-lavender relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          badge="Join Our Network"
          title={<>Connect With <span className="gradient-brand-text">Us</span></>}
          subtitle="Follow us on social media for updates, AI insights, and more."
        />

        {platforms.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <p className="text-base font-medium text-foreground">Social links coming soon</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We're connecting our social channels. Follow us soon for the latest updates!
            </p>
          </div>
        ) : (
          <>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-8%" }}
        >
          {platforms.map((platform) => (
            <motion.a
              key={platform.key}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow us on ${PLATFORM_NAMES[platform.key] || platform.label}`}
              data-testid={`link-social-${platform.key}`}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.5 } }}
              className="group flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl glass-card transition-all duration-300 card-hover-glow shimmer-hover"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl gradient-brand-subtle value-icon-hover text-primary mb-3">
                {SOCIAL_ICONS[platform.key] || <Phone className="w-6 h-6" />}
              </div>

              <span className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                {PLATFORM_NAMES[platform.key] || platform.label}
              </span>

              {platform.followers && platform.followers !== "0" && (
                <span className="text-xs text-muted-foreground mt-1">
                  {formatCount(platform.followers)} {platform.key === 'youtube' ? 'Subscribers' : 'Followers'}
                </span>
              )}

              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </motion.a>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-primary/10"
          initial={{ opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {settings.email && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg gradient-brand-subtle flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 font-display">Email</h3>
                <a
                  href={`mailto:${settings.email}`}
                  data-testid="link-contact-email"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {settings.email}
                </a>
              </div>
            </div>
          )}

          {settings.address && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg gradient-brand-subtle flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 font-display">Location</h3>
                <p className="text-muted-foreground">{settings.address}</p>
              </div>
            </div>
          )}
        </motion.div>
        </>
        )}
      </div>
    </section>
  );
}
