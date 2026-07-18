import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: "blur(8px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
