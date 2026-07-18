import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";
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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

export function TeamSection() {
  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const publishedMembers = teamMembers.filter(m => m.enabled !== false);

  return (
    <section
      id="team"
      className="relative pb-20 pt-24 overflow-hidden section-a tint-rose"
      data-testid="section-team"
    >
      <div className="absolute inset-0 mandala-pattern opacity-[0.03]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            badge="Our Talented Team"
            title={<><span>Meet the </span><span className="gradient-brand-text">Innovators</span></>}
            subtitle="A passionate team of AI specialists, developers, and visionaries crafting the future of intelligent technology from Nepal to the world."
            direction="down"
          />

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
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-8%" }}
            >
              {publishedMembers.map((member) => {
                const roleEmoji = roleIcons[member.role] || "⭐";
                return (
                  <motion.div key={member.id} variants={avatarVariants}>
                    <Card
                      className="glass-card border-0 transition-all duration-300 group overflow-hidden relative h-full card-hover-glow shimmer-hover"
                      data-testid={`card-team-${member.id}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-start/0 via-brand-mid/5 to-brand-end/0 group-hover:from-brand-start/10 group-hover:via-brand-mid/15 group-hover:to-brand-end/10 transition-all duration-300" />

                      <CardContent className="p-6 text-center relative z-10">
                        <div className="mb-6 relative inline-block">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-start to-brand-end opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" style={{ inset: "-4px" }} />
                          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-brand-start/30 group-hover:border-brand-start/80 transition-colors relative z-10 bg-muted flex items-center justify-center">
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={member.name}
                                width="112"
                                height="112"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                              />
                            ) : null}
                            <span className={`text-2xl font-bold text-primary ${member.imageUrl ? 'hidden' : ''}`}>
                              {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        </div>

                        <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                          {roleEmoji}
                        </div>

                        <h3 className="text-lg font-semibold mb-2 font-display group-hover:text-primary transition-colors">
                          {member.name}
                        </h3>

                        <Badge variant="outline" className="mb-4 inline-block">
                          {member.role}
                        </Badge>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {member.description}
                        </p>

                        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mt-4 w-0 group-hover:w-full transition-all duration-300" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Team coming soon</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                We're assembling an incredible team of innovators. Check back soon!
              </p>
            </div>
          )}
      </div>
    </section>
  );
}
