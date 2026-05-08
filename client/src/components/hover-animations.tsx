import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HoverAnimationProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  rotate?: number;
}

export function ScaleOnHover({ children, className = "", scale = 1.05 }: HoverAnimationProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.05 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RotateOnHover({ children, className = "", rotate = 5 }: HoverAnimationProps) {
  return (
    <motion.div
      whileHover={{ rotate }}
      whileTap={{ rotate: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PopOnHover({ children, className = "" }: HoverAnimationProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
