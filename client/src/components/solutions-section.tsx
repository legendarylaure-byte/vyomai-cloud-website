import { SiGoogle } from "react-icons/si";
import { Building2, Bot, Brain, BarChart3, Cloud, Cog, Shield, Target, Users, Lightbulb, Heart, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";
import { useRef } from "react";

interface SolutionsContent {
  id: string;
  badgeText: string;
  titleHighlight: string;
  titleNormal: string;
  description: string;
  enabled: boolean;
}

interface SolutionItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  gradientFrom?: string;
  gradientTo?: string;
  enabled: boolean;
  order: number;
}

const iconMap: Record<string, any> = {
  SiGoogle,
  Building2, Bot, Brain, BarChart3, Cloud, Cog, Shield, Target, Users, Lightbulb,
  Heart, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket
};

const defaultSolutions = [
  {
    icon: "SiGoogle",
    title: "Google Workspace Integration",
    description: "Connect your AI agents with Gmail, Google Calendar, Drive, and more. Automate workflows and enhance team collaboration.",
    features: ["Smart email categorization and responses", "Calendar management and scheduling", "Document analysis and summarization", "Team productivity insights"],
    gradientFrom: "#4285F4",
    gradientTo: "#34A853",
  },
  {
    icon: "Building2",
    title: "Microsoft 365 Integration",
    description: "Seamlessly integrate with Outlook, Teams, SharePoint, and the entire Microsoft ecosystem for enterprise AI.",
    features: ["Outlook email automation", "Teams bot integration", "SharePoint document processing", "Power Platform connectivity"],
    gradientFrom: "#F25022",
    gradientTo: "#0078D4",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

const featureVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const featureItem = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } },
};

export function SolutionsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const { data: solutionsData } = useQuery<{ content: SolutionsContent; items: SolutionItem[] }>({
    queryKey: ["/api/content/solutions"],
  });

  const content = solutionsData?.content;
  const items = solutionsData?.items?.filter(s => s.enabled !== false) || [];
  const displaySolutions = items.length > 0 ? items : defaultSolutions;

  if (content?.enabled === false) {
    return null;
  }

  const badgeText = content?.badgeText || "AI Solutions";
  const titleHighlight = content?.titleHighlight || "Enterprise";
  const titleNormal = content?.titleNormal || " Integrations";
  const description = content?.description || "Connect AI capabilities with the platforms you already use. Transform your workflows without disrupting your team.";

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative pb-20 pt-24 overflow-hidden section-b tint-rose"
      data-testid="section-solutions"
    >
      {/* Parallax mandala */}
      <motion.div
        className="absolute inset-0 mandala-pattern opacity-[0.03]"
        style={{ y: mandalaY }}
      />

      {/* Brand glow */}
      <div className="dark-glow-orb top-1/3 -left-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            badge={badgeText}
            title={<><span>{titleHighlight.trim()}</span><span className="gradient-brand-text">{titleNormal}</span></>}
            subtitle={description}
            dark
          />

          <motion.div
            className="grid lg:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {displaySolutions.map((solution: any, index) => {
              const IconComponent = iconMap[solution.icon] || Building2;
              const gradientFrom = solution.gradientFrom || "#8a50e8";
              const gradientTo = solution.gradientTo || "#e07040";
              const features = solution.features || [];

              return (
                <motion.div
                  key={solution.id || index}
                  variants={itemVariants}
                  className="metallic-card rounded-2xl p-8 hover-elevate transition-all duration-300 overflow-visible card-glow shimmer-hover solutions-card-tilt"
                  data-testid={`card-solution-${index}`}
                  whileHover={{ y: -4, transition: { duration: 0.5 } }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 value-icon-hover"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}33, ${gradientTo}33)` }}
                  >
                    <IconComponent className="w-8 h-8" />
                  </div>

            <h3 className="text-2xl font-bold mb-4 font-display text-foreground group-hover:text-primary transition-colors">
                    {solution.title}
                  </h3>

                  <p className="text-foreground/60 mb-6 leading-relaxed">
                    {solution.description}
                  </p>

                  <motion.ul
                    className="space-y-3 mb-8"
                    variants={featureVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {features.map((feature: string, i: number) => (
                      <motion.li key={i} className="flex items-start gap-3" variants={featureItem}>
                        <div className="w-5 h-5 rounded-full gradient-brand-subtle flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground/70">{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <Button
                    variant="outline"
                    className="group border-border/20 text-foreground hover:bg-card/10"
                    onClick={scrollToContact}
                    data-testid={`button-learn-more-${index}`}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="mt-16 gradient-brand-subtle rounded-2xl p-8 sm:p-12 text-center border border-black/5 dark:border-white/8 relative overflow-hidden group hover-elevate"
            initial={{ opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="absolute inset-0 gradient-brand opacity-5 group-hover:opacity-10 transition-all duration-300" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 font-display text-foreground group-hover:text-primary transition-colors">
                Need Custom Integration?
              </h3>
              <p className="text-foreground/60 max-w-2xl mx-auto mb-6">
                We can build AI solutions for any platform or create custom integrations
                for your specific enterprise needs. Let&apos;s discuss your requirements.
              </p>
              <Button size="lg" onClick={scrollToContact} data-testid="button-discuss-project" className="bg-gradient-to-r from-primary via-[#c060d0] to-accent text-white border-0 shadow-lg shadow-brand-start/25">
                Discuss Your Project
              </Button>
            </div>
          </motion.div>
      </div>
    </section>
  );
}
