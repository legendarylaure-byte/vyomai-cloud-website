import { SiGoogle } from "react-icons/si";
import { Building2, Bot, Brain, BarChart3, Cloud, Cog, Shield, Target, Users, Lightbulb, Heart, Mail, Calendar, FileText, Zap, Globe, Lock, Settings, Star, Rocket, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useQuery } from "@tanstack/react-query";

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
    gradientFrom: "blue-500/20",
    gradientTo: "green-500/20",
  },
  {
    icon: "Building2",
    title: "Microsoft 365 Integration",
    description: "Seamlessly integrate with Outlook, Teams, SharePoint, and the entire Microsoft ecosystem for enterprise AI.",
    features: ["Outlook email automation", "Teams bot integration", "SharePoint document processing", "Power Platform connectivity"],
    gradientFrom: "orange-500/20",
    gradientTo: "blue-500/20",
  },
];

export function SolutionsSection() {
  const { ref, isVisible } = useScrollAnimation();

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
      className="relative py-24 overflow-hidden"
      data-testid="section-solutions"
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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {displaySolutions.map((solution: any, index) => {
              const IconComponent = iconMap[solution.icon] || Building2;
              const gradientFrom = solution.gradientFrom || "blue-500/20";
              const gradientTo = solution.gradientTo || "green-500/20";
              const features = solution.features || [];
              
              return (
                <div
                  key={solution.id || index}
                  className={`glass-card rounded-2xl p-8 hover-elevate transition-all duration-300 overflow-visible`}
                  data-testid={`card-solution-${index}`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${gradientFrom} to-${gradientTo} flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 font-[Space_Grotesk]">
                    {solution.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {solution.description}
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    {features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    variant="outline"
                    className="group"
                    onClick={scrollToContact}
                    data-testid={`button-learn-more-${index}`}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-16 glass-card rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 font-[Space_Grotesk]">
              Need Custom Integration?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              We can build AI solutions for any platform or create custom integrations 
              for your specific enterprise needs. Let's discuss your requirements.
            </p>
            <Button size="lg" onClick={scrollToContact} data-testid="button-discuss-project">
              Discuss Your Project
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
