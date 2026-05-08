import { Target, Users, Lightbulb, Heart, Bot, Brain, Cloud, BarChart3, Cog, Shield, Building2, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useQuery } from "@tanstack/react-query";

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

export function AboutSection() {
  const { ref, isVisible } = useScrollAnimation();
  
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
  const description = content?.description || "VyomAi Cloud Pvt. Ltd is a startup company dedicated to AI technology research and development. Based in Tokha, Kathmandu, Nepal, we work tirelessly to provide the best AI product solutions and consulting services for organizations seeking to embrace the future.";

  return (
    <section
      id="about"
      className="relative py-24 overflow-hidden"
      data-testid="section-about"
    >
      <div className="absolute inset-0 mandala-pattern opacity-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {badgeText}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-[Space_Grotesk]">
              <span className="gradient-text">{titleHighlight}</span>
              <span className="text-foreground">{titleNormal}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayValues.map((value: any, index) => {
              const IconComponent = iconMap[value.icon] || Target;
              return (
                <Card
                  key={value.id || index}
                  className="glass-card border-0 hover-elevate transition-all duration-300 group"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 glass-card rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 font-[Space_Grotesk]">
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
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-accent/20 flex items-center justify-center">
                  <div className="absolute inset-4 rounded-xl mandala-pattern opacity-40" />
                  <div className="relative text-center p-8">
                    <div className="text-6xl font-bold gradient-text mb-2 font-[Space_Grotesk]">
                      व्योम
                    </div>
                    <div className="text-lg text-muted-foreground">
                      "Vyom" - The infinite sky
                    </div>
                    <div className="text-sm text-muted-foreground/70 mt-2">
                      Limitless possibilities in AI
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
