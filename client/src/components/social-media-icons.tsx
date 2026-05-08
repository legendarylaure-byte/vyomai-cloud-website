import { useQuery } from "@tanstack/react-query";
import { type SiteSettings } from "@shared/schema";
import { Linkedin, Instagram, Facebook, MessageCircle, Phone, Youtube } from "lucide-react";
import { SiWhatsapp, SiViber } from "react-icons/si";

interface SocialMediaIconsProps {
  size?: "sm" | "md" | "lg";
}

const socialPlatforms = [
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    hoverColor: "hover:text-blue-600",
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    hoverColor: "hover:text-pink-600",
  },
  {
    key: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    hoverColor: "hover:text-blue-600",
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    hoverColor: "hover:text-red-600",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    hoverColor: "hover:text-green-600",
    customIcon: true,
  },
  {
    key: "viber",
    name: "Viber",
    icon: Phone,
    color: "#7360F2",
    hoverColor: "hover:text-purple-600",
    customIcon: true,
  },
];

export function SocialMediaIcons({ size = "md" }: SocialMediaIconsProps) {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const getUrl = (key: string) => {
    return settings?.socialLinks?.[key as keyof typeof settings.socialLinks];
  };

  const isEnabled = (key: string) => {
    const enabled =
      settings?.socialMediaEnabled?.[key as keyof typeof settings.socialMediaEnabled];
    return enabled !== false; // Default to true if not specified
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
      {socialPlatforms.map((platform) => {
        const url = getUrl(platform.key);
        const enabled = isEnabled(platform.key);

        if (!enabled || !url) return null;

        const Icon = platform.customIcon && platform.key === "whatsapp" ? SiWhatsapp : platform.customIcon && platform.key === "viber" ? SiViber : platform.icon;

        return (
          <a
            key={platform.key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={platform.name}
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 group hover-elevate active-elevate-2 relative overflow-hidden`}
            style={{
              backgroundColor: `${platform.color}20`,
              border: `2px solid ${platform.color}40`,
            }}
            data-testid={`link-social-${platform.key}`}
          >
            {/* Animated glow background */}
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"
              style={{
                backgroundColor: `${platform.color}20`,
                filter: "blur(8px)",
              }}
            />

            {/* Icon */}
            <Icon
              className={`${iconSizeClasses[size]} relative z-10 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6`}
              style={{ color: platform.color }}
            />
          </a>
        );
      })}
    </div>
  );
}
