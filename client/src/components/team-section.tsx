import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Sparkles } from "lucide-react";
import { type TeamMember } from "@shared/schema";

const roleIcons: Record<string, string> = {
  "AI Engineer": "🤖",
  "Developer": "💻",
  "Designer": "🎨",
  "Product Manager": "📊",
  "Data Scientist": "📈",
  "CTO": "🚀",
  "CEO": "👑",
  "ML Engineer": "🧠",
};

export function TeamSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const publishedMembers = teamMembers.filter(m => m.enabled !== false);

  return (
    <section
      id="team"
      className="relative py-24 overflow-hidden"
      data-testid="section-team"
    >
      <div className="absolute inset-0 mandala-pattern opacity-5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 flex items-center justify-center gap-2 mx-auto w-fit">
              <Sparkles className="w-4 h-4" />
              Our Talented Team
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-[Space_Grotesk]">
              <span className="text-foreground">Meet the </span>
              <span className="gradient-text">Innovators</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A passionate team of AI specialists, developers, and visionaries crafting 
              the future of intelligent technology from Nepal to the world.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, idx) => (
                <Card key={idx} className="glass-card border-0 overflow-hidden">
                  <CardContent className="p-6 text-center space-y-4">
                    <Skeleton className="w-28 h-28 rounded-full mx-auto" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : publishedMembers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {publishedMembers.map((member, index) => {
                const roleEmoji = roleIcons[member.role] || "⭐";
                return (
                  <Card
                    key={member.id}
                    className="glass-card border-0 hover-elevate transition-all duration-300 group overflow-hidden relative"
                    style={{ transitionDelay: `${index * 50}ms` }}
                    data-testid={`card-team-${member.id}`}
                  >
                    {/* Animated gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0 group-hover:from-primary/10 group-hover:via-primary/15 group-hover:to-accent/10 transition-all duration-300" />
                    
                    <CardContent className="p-6 text-center relative z-10">
                      {/* Avatar with animated ring */}
                      <div className="mb-6 relative inline-block">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" style={{ inset: "-4px" }} />
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary/80 transition-colors relative z-10 bg-background">
                          <img
                            src={member.imageUrl}
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>

                      {/* Role emoji badge */}
                      <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                        {roleEmoji}
                      </div>

                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      
                      <Badge variant="outline" className="mb-4 inline-block">
                        {member.role}
                      </Badge>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {member.description}
                      </p>

                      {/* Animated bottom accent line */}
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mt-4 w-0 group-hover:w-full transition-all duration-300" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No team members published yet</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
