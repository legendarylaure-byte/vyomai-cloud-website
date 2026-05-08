import { useQuery } from "@tanstack/react-query";
import { type SiteSettings } from "@shared/schema";
import { Linkedin, Instagram, Facebook, Youtube, MessageCircle, Phone } from "lucide-react";
import { SiWhatsapp, SiViber } from "react-icons/si";

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

export function ConnectWithUs() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: integrations = [] } = useQuery<any[]>({
    queryKey: ["/api/integrations"],
  });

  if (!settings) return null;

  // backend already filters by isPublished, we just need to map them to the UI
  const platforms = integrations.map(i => ({
    key: i.platform,
    label: PLATFORM_NAMES[i.platform] || i.platform,
    url: settings.socialLinks?.[i.platform as keyof typeof settings.socialLinks] || i.profileUrl,
    followers: i.analytics?.followersCount || "0",
    isConnected: i.isConnected
  })).filter(p => p.url); // only show if there is a link

  if (platforms.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-background/50 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3">
              Connect With Us
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow us on social media for updates, AI insights, and more. Stay connected with VyomAi's latest innovations.
            </p>
          </div>

          {/* Social Media Icons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
            {platforms.map((platform) => (
              <a
                key={platform.key}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-social-${platform.key}`}
                className="group flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl bg-gradient-to-br from-background/50 to-background/30 border border-primary/20 hover-elevate transition-all duration-300"
              >
                {/* Icon Container */}
                <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 text-primary group-hover:text-accent mb-3">
                  {SOCIAL_ICONS[platform.key] || <Phone className="w-6 h-6" />}
                </div>

                {/* Platform Label */}
                <span className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                  {PLATFORM_NAMES[platform.key] || platform.label}
                </span>

                {/* Followers Count */}
                {platform.followers && platform.followers !== "0" && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatCount(platform.followers)} {platform.key === 'youtube' ? 'Subscribers' : 'Followers'}
                  </span>
                )}

                {/* Hover indicator */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              </a>
            ))}
          </div>

          {/* Contact Info Below */}
          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-primary/10">
            {/* Email */}
            {settings.socialLinks?.linkedin && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Email</h3>
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

            {/* Location */}
            {settings.address && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Location</h3>
                  <p className="text-muted-foreground">{settings.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
