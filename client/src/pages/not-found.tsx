import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { FloatingParticles } from "@/components/floating-particles";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center section-a relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: "-4s" }} />
      </div>

      <FloatingParticles count={8} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 text-center px-4"
      >
        {/* Large 404 with gradient */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-[8rem] sm:text-[10rem] font-bold font-display leading-none gradient-brand-text select-none">
            404
          </h1>
        </motion.div>

        {/* Rocket icon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-2xl font-bold text-foreground font-display mb-3"
        >
          Lost in the Cosmos
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-muted-foreground mb-8 max-w-sm mx-auto"
        >
          This page drifted beyond our reach. Let's navigate you back to familiar territory.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            onClick={() => setLocation("/")}
            className="admin-btn-glow gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
