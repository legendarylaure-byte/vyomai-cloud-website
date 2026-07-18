import { useQuery } from "@tanstack/react-query";
import { Star, Quote } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/text-reveal";
import { Skeleton } from "@/components/ui/skeleton";

interface TestimonialItem {
  id: string;
  name: string;
  company?: string;
  role?: string;
  avatarUrl?: string;
  content: string;
  rating?: number;
}

const avatarLetters = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function TestimonialsSection() {
  const { data: testimonials = [], isLoading } = useQuery<TestimonialItem[]>({
    queryKey: ["/api/testimonials"],
  });

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-8%" });

  if (isLoading) {
    return (
      <section ref={sectionRef} id="testimonials" className="relative pb-20 pt-24 overflow-hidden section-a tint-pink" data-testid="section-testimonials">
        <div className="absolute inset-0 mandala-pattern opacity-[0.02]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
          <SectionHeader
            badge="Testimonials"
            title={<>What Our Clients <span className="gradient-brand-text">Say</span></>}
            subtitle="Trusted by businesses in Nepal and beyond"
          />
        </div>
        <div className="relative z-10 flex gap-6 px-8 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[85vw] sm:w-[340px] md:w-[380px] shrink-0 h-64 rounded-3xl bg-foreground/5" />
          ))}
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  const items = [...testimonials, ...testimonials];

  return (
    <section ref={sectionRef} id="testimonials" className="relative pb-20 pt-24 overflow-hidden section-a tint-pink" data-testid="section-testimonials">
      <div className="absolute inset-0 mandala-pattern opacity-[0.02]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <SectionHeader
          badge="Testimonials"
          title={<>What Our Clients <span className="gradient-brand-text">Say</span></>}
          subtitle="Trusted by businesses in Nepal and beyond"
        />
      </div>

      {/* Auto-scrolling marquee — accelerates when in view */}
      <div className="relative z-10">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex animate-marquee"
          style={{ width: "max-content" }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          {items.map((t, index) => (
            <motion.div
              key={`${t.id}-${index}`}
              className="w-[85vw] sm:w-[340px] md:w-[380px] shrink-0 mx-3"
              initial={{ opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 }}
              animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 } : {}}
              transition={{ duration: 0.7, delay: Math.min(index * 0.05, 0.5) }}
            >
              <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 card-hover-glow shimmer-hover">
                <div className="flex items-start gap-3 mb-4">
                  <Quote className="w-8 h-8 text-brand-start/30 shrink-0 mt-1" />
                  <blockquote className="text-foreground/80 italic leading-relaxed text-[15px]">
                    &ldquo;{t.content}&rdquo;
                  </blockquote>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} loading="lazy" width="40" height="40" className="w-10 h-10 rounded-full object-cover border-2 border-brand-start/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-foreground font-bold text-sm">
                      {avatarLetters(t.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-[15px]">{t.name}</p>
                    {[t.role, t.company].filter(Boolean).length > 0 && (
                      <p className="text-xs text-primary truncate">{[t.role, t.company].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 shrink-0" aria-label={`Rated ${t.rating || 5} out of 5 stars`}>
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300 }}
                      >
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
