import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  mode?: "char" | "word" | "line";
  delay?: number;
  staggerDelay?: number;
  gradient?: boolean;
}

export function TextReveal({
  children,
  className = "",
  as: Tag = "h2",
  mode = "word",
  delay = 0,
  staggerDelay = 0.06,
  gradient = false,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  const text = children;
  let items: string[];

  if (mode === "char") {
    items = text.split("");
  } else if (mode === "word") {
    items = text.split(" ");
  } else {
    items = text.split("\n");
  }

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
        transition: {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`${className}`}
    >
      {items.map((item, i) => (
        <motion.span
          key={i}
          variants={child}
          className={`${gradient ? "gradient-brand-text" : ""}`}
          style={{ display: "inline" }}
        >
          {item}{i < items.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface SectionHeaderProps {
  badge?: string;
  title: ReactNode;
  subtitle?: string;
  dark?: boolean;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  dark = false,
  className = "",
  direction = "up",
}: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const directionOffset = {
    up: { y: 24 },
    down: { y: -24 },
    left: { x: 24 },
    right: { x: -24 },
  };

  const fadeUp = {
    hidden: { opacity: 0, ...directionOffset[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] },
    },
  };

  const isStringTitle = typeof title === "string";

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`text-center max-w-3xl mx-auto mb-10 sm:mb-16 ${className}`}
    >
      {badge && (
        <motion.div variants={fadeUp}>
          <span className="gradient-title-box text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            {badge}
          </span>
        </motion.div>
      )}
      <motion.div variants={fadeUp}>
        {isStringTitle ? (
          <TextReveal as="h2" mode="word" className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-4 text-foreground heading-tight section-title-hover section-title-shadow">
            {title as string}
          </TextReveal>
        ) : (
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-4 text-foreground heading-tight section-title-hover section-title-shadow">
            {title}
          </h2>
        )}
      </motion.div>
      {subtitle && (
        <motion.div
          variants={fadeUp}
        >
          <TextReveal as="p" mode="word" delay={0.3} staggerDelay={0.04} className="text-base sm:text-lg text-foreground/60">
            {subtitle}
          </TextReveal>
        </motion.div>
      )}
    </motion.div>
  );
}
