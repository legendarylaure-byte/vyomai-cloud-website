import { Target, Users, Lightbulb, Heart, Bot, Brain, Cloud, BarChart3, Cog, Shield, Building2, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";
import { useRef } from "react";

interface AboutContent {
  id: string;
  badgeText: string;
  titleHighlight: string;
  titleNormal: string;
  description: string;
  enabled: boolean;
}

interface AboutValue {
  id: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
}

const iconMap: Record<string, any> = {
  Target, Users, Lightbulb, Heart, Bot, Brain, Cloud, BarChart3, Cog, Shield,
  Building2, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket
};

const defaultValues = [
  { icon: "Target", title: "Our Mission", description: "To democratize AI technology and make it accessible for businesses of all sizes, from startups to enterprises." },
  { icon: "Users", title: "Knowledge Sharing", description: "We believe in sharing knowledge. If you learn from us, share it with others for the betterment of everyone." },
  { icon: "Lightbulb", title: "Innovation", description: "Constantly researching and developing cutting-edge AI solutions that solve real-world problems." },
  { icon: "Heart", title: "Nepal to Global", description: "Rooted in traditional Nepali values, we bring our expertise to organizations worldwide." },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, filter: "blur(10px)", scale: 0.95 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

const checklistVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
};

const checklistItem = {
  hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } },
};

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orbX = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const { data: aboutData } = useQuery<{ content: AboutContent; values: AboutValue[] }>({
    queryKey: ["/api/content/about"],
  });

  const content = aboutData?.content;
  const values = aboutData?.values?.filter(v => v.enabled !== false) || [];
  const displayValues = values.length > 0 ? values : defaultValues;

  if (content?.enabled === false) {
    return null;
  }

  const badgeText = content?.badgeText || "About VyomAi";
  const titleHighlight = content?.titleHighlight || "Pioneering AI";
  const titleNormal = content?.titleNormal || " in Nepal";
  const description = content?.description || "VyomAi Cloud Pvt. Ltd is an AI technology company dedicated to research and development. Based in Tokha, Kathmandu, Nepal, we work tirelessly to provide the best AI product solutions and consulting services for organizations seeking to embrace the future.";

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative pb-20 pt-16 sm:pt-24 overflow-hidden section-b about-top-glow tint-rose"
      aria-labelledby="about"
      data-testid="section-about"
    >
      {/* Parallax mandala */}
      <motion.div
        className="absolute inset-0 mandala-pattern opacity-5"
        style={{ y: mandalaY }}
      />

      {/* Brand glow orb */}
      <motion.div
        className="dark-glow-orb -top-40 -right-40"
        style={{ x: orbX }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div>
          {/* Editorial split: text left, "व्योम" visual right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            >
              <SectionHeader
                badge={badgeText}
                title={<><span>{titleHighlight}</span><span className="gradient-brand-text">{titleNormal}</span></>}
                subtitle={description}
              />
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: 0.12 }}
            >
              <div className="video-glow rounded-2xl">
                <video
                  autoPlay muted loop playsInline
                  preload="metadata"
                  className="w-full h-[260px] sm:h-[300px] md:h-[360px] object-cover rounded-2xl"
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1440'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25'%3E%3Cstop offset='0%25' stop-color='%231E1548'/%3E%3Cstop offset='100%25' stop-color='%230D0B1A'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3C/svg%3E"
                  onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                >
                  <source src="/assets/vyomai-about.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-2xl" />
              </div>
            </motion.div>
          </div>

          {/* Values Grid */}
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-5%" }}
          >
            {displayValues.map((value: any, index) => {
              const IconComponent = iconMap[value.icon] || Target;
              return (
                <motion.div key={value.id || index} variants={itemVariants}>
                   <Card className="metallic-card transition-all duration-300 group h-full card-glow shimmer-hover">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl gradient-brand-subtle flex items-center justify-center mb-4 value-icon-hover">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground font-display">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Why Choose VyomAi */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left: Checklist in glass card */}
              <motion.div
                className="metallic-card rounded-2xl p-8 mission-card-glow group"
                variants={checklistVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 font-display text-foreground">
                  Why Choose VyomAi?
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We work hard and try to give you the best AI product solutions for your
                  organization with competitive consulting and platform integration services.
                  Our team combines traditional wisdom with cutting-edge technology.
                </p>
                <ul className="space-y-3">
                  {[
                    "Expert AI consultation tailored to your needs",
                    "Seamless integration with existing platforms",
                    "Continuous support and knowledge transfer",
                    "Solutions built with security in mind",
                  ].map((item, i) => (
                    <motion.li key={i} className="flex items-start gap-3" variants={checklistItem}>
                      <div className="w-5 h-5 rounded-full gradient-brand-subtle flex items-center justify-center mt-0.5 flex-shrink-0 checklist-bullet-hover">
                        <div className="w-2 h-2 rounded-full gradient-brand" />
                      </div>
                      <span className="text-foreground/70">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Right: व्योम box (moved from editorial split) */}
              <motion.div
                initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
              >
                <div className="aspect-[4/3] rounded-2xl metallic-card vyom-box flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-4 rounded-xl mandala-pattern opacity-30 mandala-hover-rotate" />
                  <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand-start) 8%, transparent) 0%, transparent 50%)' }} />
                  <div className="relative text-center p-6">
                    <div className="text-4xl font-bold gradient-brand-text mb-2 font-display">
                      व्योम
                    </div>
                    <div className="text-base text-muted-foreground">
                      "Vyom" - The infinite sky
                    </div>
                    <div className="text-xs text-foreground/40 mt-2">
                      Limitless possibilities in AI
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
