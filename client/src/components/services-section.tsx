import { Bot, Brain, BarChart3, Cloud, Cog, Shield, Target, Users, Lightbulb, Heart, Building2, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useQuery } from "@tanstack/react-query";

interface ServicesContent {
  id: string;
  badgeText: string;
  titleNormal: string;
  titleHighlight: string;
  description: string;
  enabled: boolean;
}

interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
}

const iconMap: Record<string, any> = {
  Bot, Brain, BarChart3, Cloud, Cog, Shield, Target, Users, Lightbulb, Heart,
  Building2, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket
};

const defaultServices = [
  { icon: "Bot", title: "AI Agent Templates", description: "Ready-to-deploy AI agents customized for your business needs. Automate tasks and enhance productivity." },
  { icon: "Brain", title: "Custom AI Bots", description: "Intelligent chatbots and virtual assistants tailored to your specific requirements and workflows." },
  { icon: "Cloud", title: "Platform Integration", description: "Seamless integration with Google Workspace, Microsoft 365, and enterprise cloud platforms." },
  { icon: "BarChart3", title: "AI Analytics", description: "Data-driven insights with intelligent AI that provides expert analytical reports for your business." },
  { icon: "Cog", title: "AI Consultation", description: "Expert guidance on AI strategy, implementation, and best practices for your organization." },
  { icon: "Shield", title: "Secure Solutions", description: "Enterprise-grade security ensuring your data and AI systems are protected at all times." },
];

export function ServicesSection() {
  const { ref, isVisible } = useScrollAnimation();

  const { data: servicesData } = useQuery<{ content: ServicesContent; items: ServiceItem[] }>({
    queryKey: ["/api/content/services"],
  });

  const content = servicesData?.content;
  const items = servicesData?.items?.filter(s => s.enabled !== false) || [];
  const displayServices = items.length > 0 ? items : defaultServices;

  if (content?.enabled === false) {
    return null;
  }

  const badgeText = content?.badgeText || "Our Services";
  const titleNormal = content?.titleNormal || "What We ";
  const titleHighlight = content?.titleHighlight || "Offer";
  const description = content?.description || "Comprehensive AI solutions designed to transform how your organization works, from automation to intelligent analytics.";

  return (
    <section
      id="services"
      className="relative py-24 bg-muted/30"
      data-testid="section-services"
    >
      <div className="absolute inset-0 particle-bg opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          ref={ref}
          className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              {badgeText}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-[Space_Grotesk]">
              <span className="text-foreground">{titleNormal}</span>
              <span className="gradient-text">{titleHighlight}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayServices.map((service: any, index) => {
              const IconComponent = iconMap[service.icon] || Bot;
              return (
                <Card
                  key={service.id || index}
                  className="glass-card border-0 hover-elevate transition-all duration-300 group overflow-visible"
                  data-testid={`card-service-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
