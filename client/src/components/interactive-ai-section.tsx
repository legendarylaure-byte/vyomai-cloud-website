import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Play, Zap, Search, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/text-reveal";
import { AIPlayground } from "@/components/ai-playground";
import { AIWorkflowVisualizer } from "@/components/ai-workflow-visualizer";
import { AISpeedChallenge } from "@/components/ai-speed-challenge";
import { AISolutionFinder } from "@/components/ai-solution-finder";

type Tab = "tagline" | "workflow" | "speed" | "solution";

const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "tagline", label: "Tagline Lab", icon: <PenTool className="w-4 h-4" />, description: "Generate catchy taglines" },
  { id: "workflow", label: "Watch AI Work", icon: <Play className="w-4 h-4" />, description: "See AI pipelines in action" },
  { id: "speed", label: "You vs AI", icon: <Zap className="w-4 h-4" />, description: "Challenge AI to a speed test" },
  { id: "solution", label: "Find Your Solution", icon: <Search className="w-4 h-4" />, description: "Get a custom recommendation" },
];

export function InteractiveAISection() {
  const [activeTab, setActiveTab] = useState<Tab>("tagline");

  return (
    <section id="interactive-ai" className="relative pb-20 pt-16 sm:pt-24 overflow-hidden section-a tint-lavender">
      <div className="absolute inset-0 mandala-pattern opacity-[0.02]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          badge="Try It Yourself"
          title={<>Interactive <span className="gradient-brand-text">AI Experience</span></>}
          subtitle="Don't just read about AI — experience it. Play, build, and discover how VyomAi automates real business problems."
          direction="right"
        />

        {/* Tab navigation */}
        <div role="tablist" className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-3 min-h-[44px] rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                activeTab === tab.id
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              {tab.icon}
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-[10px] text-muted-foreground hidden sm:block">{tab.description}</div>
              </div>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-2xl border-2 border-primary/30 pointer-events-none"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          layout
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="rounded-3xl border border-border/30 bg-background/50 backdrop-blur-xl p-6 sm:p-8 shadow-xl"
        >
          <AnimatePresence>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "tagline" && <AIPlayground />}
              {activeTab === "workflow" && <AIWorkflowVisualizer />}
              {activeTab === "speed" && <AISpeedChallenge />}
              {activeTab === "solution" && <AISolutionFinder />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-muted-foreground mb-3">
            Powered by Google Gemini AI • Real-time responses
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <Sparkles className="w-3 h-3" />
            <span>Want more? Try our AI Business Consultant for personalized advice</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
