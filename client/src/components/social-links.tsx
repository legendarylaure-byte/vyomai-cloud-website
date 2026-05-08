import { SiLinkedin, SiInstagram, SiFacebook, SiWhatsapp, SiYoutube } from "react-icons/si";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { type SiteSettings } from "@shared/schema";

export function SocialLinks({ size = "default" }: { size?: "default" | "lg" }) {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: integrations = [] } = useQuery<any[]>({
    queryKey: ["/api/integrations"],
  });

  const getSocialLinks = () => {
    // integrations is already filtered by isPublished on the backend
    return integrations.map(i => {
      const platformInfo: any = {
        linkedin: { icon: SiLinkedin, label: "LinkedIn", color: "hover:text-blue-500" },
        instagram: { icon: SiInstagram, label: "Instagram", color: "hover:text-pink-500" },
        facebook: { icon: SiFacebook, label: "Facebook", color: "hover:text-blue-600" },
        whatsapp: { icon: SiWhatsapp, label: "WhatsApp", color: "hover:text-green-500" },
        youtube: { icon: SiYoutube, label: "YouTube", color: "hover:text-red-500" },
        viber: { icon: Phone, label: "Viber", color: "hover:text-purple-500" },
      };

      const info = platformInfo[i.platform];
      if (!info) return null;

      const href = settings?.socialLinks?.[i.platform as keyof typeof settings.socialLinks] || i.profileUrl;
      if (!href) return null;

      return {
        ...info,
        href,
        platform: i.platform
      };
    }).filter(Boolean);
  };

  const iconSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const socialLinks = getSocialLinks();

  return (
    <div className="flex items-center gap-1" data-testid="social-links">
      {socialLinks.map((link) => (
        <Button
          key={link.label}
          variant="ghost"
          size="icon"
          asChild
          className={`${link.color} transition-colors`}
        >
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            data-testid={`link-social-${link.label.toLowerCase()}`}
          >
            <link.icon className={iconSize} />
          </a>
        </Button>
      ))}
    </div>
  );
}
