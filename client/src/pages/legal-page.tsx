import { motion } from "framer-motion";
import { Footer } from "@/components/footer";
import { SeoHead } from "@/components/seo-head";
import { FloatingParticles } from "@/components/floating-particles";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  ogDescription: string;
  children: React.ReactNode;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } },
};

export function LegalPageLayout({ title, subtitle, lastUpdated, ogDescription, children }: LegalPageProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full section-a relative overflow-hidden">
      <SeoHead
        title={`${title} | VyomAi Cloud`}
        description={ogDescription}
        ogUrl={`https://vyomai.cloud${window.location.pathname}`}
        canonical={`https://vyomai.cloud${window.location.pathname}`}
      />

      <FloatingParticles count={8} />

      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-brand-start/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-brand-mid/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
        {/* Back button */}
        <motion.button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-8 transition-colors group"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </motion.button>

        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow" />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">Legal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display heading-tight section-title-shadow mb-4">
            <span className="gradient-brand-text">{title}</span>
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl">{subtitle}</p>
          <p className="text-sm text-foreground/40 mt-3">Last updated: {lastUpdated}</p>
        </motion.div>

        {/* Content card */}
        <motion.div
          className="glass-card rounded-2xl p-8 sm:p-10 lg:p-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="prose prose-lg max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-foreground/70 prose-p:leading-relaxed
            prose-ul:text-foreground/70 prose-li:leading-relaxed
            prose-strong:text-foreground
            prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline
            [&>*:first-child]:mt-0"
          >
            {children}
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
