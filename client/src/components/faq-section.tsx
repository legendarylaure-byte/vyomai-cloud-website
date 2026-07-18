import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";
import { Skeleton } from "@/components/ui/skeleton";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: faqs = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/faq"],
  });

  const categories = ["all", ...new Set(faqs.map((f) => f.category || "general"))];

  const filtered = activeCategory === "all"
    ? faqs
    : faqs.filter((f) => (f.category || "general") === activeCategory);

  if (isLoading) {
    return (
      <section id="faq" className="pb-20 pt-24 section-b tint-lavender relative overflow-hidden" data-testid="section-faq">
        <div className="dark-glow-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <SectionHeader
            badge="FAQ"
            title={<>Frequently Asked <span className="gradient-brand-text">Questions</span></>}
            subtitle="Find answers to common questions about our services"
            dark
            direction="down"
          />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted/50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="pb-20 pt-24 section-b tint-lavender relative overflow-hidden" data-testid="section-faq">
      {/* FAQPage structured data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
      <div className="dark-glow-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <SectionHeader
          badge="FAQ"
          title={<>Frequently Asked <span className="gradient-brand-text">Questions</span></>}
          subtitle="Find answers to common questions about our services"
          dark
        />

        {categories.length > 1 && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  activeCategory === cat
                    ? "gradient-brand text-white shadow-lg shadow-brand-start/25"
                    : "bg-card/5 text-foreground/60 hover:bg-card/10"
                }`}
              >
                {cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </motion.div>
        )}

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">No FAQs yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                We're preparing answers to common questions. Check back soon!
              </p>
            </div>
          ) : (
            filtered.map((faq) => (
              <motion.div
                key={faq.id}
                variants={staggerItem}
                className="metallic-card rounded-xl overflow-hidden hover:bg-card/[0.03] transition-colors duration-300 card-hover-glow shimmer-hover group"
              >
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  aria-expanded={openId === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                   className="w-full flex items-center justify-between p-5 text-left text-base font-semibold font-display text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-[15px] text-foreground/70 leading-relaxed pt-2">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
}
