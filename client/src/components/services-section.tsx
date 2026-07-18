import { Bot, Brain, BarChart3, Cloud, Cog, Shield, Target, Users, Lightbulb, Heart, Building2, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";
import { useRef } from "react";

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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, 60]);

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
      ref={sectionRef}
      className="relative pb-20 pt-24 overflow-hidden section-a tint-lavender"
      aria-labelledby="services"
      data-testid="section-services"
    >
      {/* Parallax mandala */}
      <motion.div
        className="absolute inset-0 mandala-pattern opacity-[0.03]"
        style={{ y: mandalaY }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            badge={badgeText}
            title={<>{titleNormal.trim()} <span className="gradient-brand-text">{titleHighlight.trim()}</span></>}
            subtitle={description}
            direction="left"
          />

          {/* Asymmetric bento: first card spans 2 cols, cards cascade from bottom with slight rotation */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-8%" }}
          >
            {displayServices.map((service: any, index) => {
              const IconComponent = iconMap[service.icon] || Bot;
              const isFirst = index === 0;
              return (
                <motion.div
                  key={service.id || index}
                  variants={cardVariants}
                  className={isFirst ? "md:col-span-2 lg:col-span-2" : ""}
                  data-testid={`card-service-${index}`}
                >
                   <Card className="glass-card border-0 transition-all duration-300 group h-full overflow-visible card-hover-glow shimmer-hover">
                    <CardContent className={`p-6 ${isFirst ? "lg:p-8" : ""}`}>
                      <div className={`rounded-2xl flex items-center justify-center mb-5 value-icon-hover ${isFirst ? "w-16 h-16" : "w-14 h-14"}`} style={{ background: "linear-gradient(135deg, rgba(224,112,64,0.15), rgba(138,80,232,0.15))" }}>
                        <IconComponent className={`text-accent ${isFirst ? "w-8 h-8" : "w-7 h-7"}`} />
                      </div>
                      <h3 className={`font-semibold mb-3 font-display ${isFirst ? "text-2xl" : "text-xl"}`}>
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
      </div>
    </section>
  );
}
