import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  label: string;
  className?: string;
}

export function AnimatedCounter({
  target,
  duration = 2,
  suffix = "",
  prefix = "",
  label,
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    requestAnimationFrame(step);

    return () => {
      hasAnimated.current = false;
    };
  }, [isInView, target, duration]);

  return (
    <motion.div
      ref={ref}
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="text-4xl md:text-5xl font-bold font-display gradient-brand-text mb-2">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-white/60 font-medium uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

interface StatsSectionProps {
  className?: string;
}

export function StatsSection({ className = "" }: StatsSectionProps) {
  const stats = [
    { target: 50, suffix: "+", label: "Projects Delivered" },
    { target: 30, suffix: "+", label: "Happy Clients" },
    { target: 15, suffix: "+", label: "AI Models Deployed" },
    { target: 99, suffix: "%", label: "Client Satisfaction" },
  ];

  return (
    <section className={`py-16 relative overflow-hidden bg-gradient-to-b from-section-a via-section-b to-section-a ${className}`} aria-label="Company statistics">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(138,80,232,0.08)_0%,transparent_70%)]" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <AnimatedCounter
              key={index}
              target={stat.target}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
