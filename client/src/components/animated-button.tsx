import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
  href?: string;
}

export function AnimatedButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  href,
}: AnimatedButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg",
    secondary: "bg-background border border-primary/30 text-foreground hover:bg-primary/10",
  };

  const buttonVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95, y: 0 },
  };

  const content = (
    <motion.div
      variants={buttonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={`px-4 py-2 rounded-lg font-medium cursor-pointer transition-all ${variants[variant]} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="inline-block">
      {content}
    </button>
  );
}
