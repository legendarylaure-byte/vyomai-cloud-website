import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import type { SiteSettings } from "@shared/schema";

const POPUP_STORAGE_KEY = "vyomai-popup-dismissed";
const POPUP_DISMISS_DURATION = 24 * 60 * 60 * 1000;

export function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (!settings?.welcomePopupEnabled) return;

    const dismissedAt = localStorage.getItem(POPUP_STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < POPUP_DISMISS_DURATION) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [settings?.welcomePopupEnabled]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (settings?.welcomePopupDismissable && e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  if (!settings?.welcomePopupEnabled || !isVisible) return null;

  const animationStyle = settings.welcomePopupAnimationStyle || "fade";

  const getAnimationVariants = () => {
    switch (animationStyle) {
      case "slide":
        return {
          initial: { opacity: 0, y: 100, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 100, scale: 0.95 },
        };
      case "zoom":
        return {
          initial: { opacity: 0, scale: 0.5 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.5 },
        };
      case "glow":
        return {
          initial: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-popup-title"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-sm" />
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  y: [null, -100],
                  opacity: [0.2, 0.5, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-12 max-w-lg w-full shadow-2xl text-center ${
              animationStyle === "glow" ? "ring-4 ring-purple-400/50 ring-offset-4 ring-offset-transparent" : ""
            }`}
          >
            {settings.welcomePopupDismissable && (
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              {settings.welcomePopupImageUrl ? (
                <img
                  src={settings.welcomePopupImageUrl}
                  alt="Welcome"
                  className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              )}
            </motion.div>

            <motion.h2
              id="welcome-popup-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              {settings.welcomePopupTitle || "Welcome"}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-lg mb-8 leading-relaxed"
            >
              {settings.welcomePopupMessage || "Welcome to our website"}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleDismiss}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all overflow-hidden"
            >
              <span className="relative z-10">
                {settings.welcomePopupButtonText || "Continue"}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700"
                initial={{ x: "-100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            {settings.welcomePopupDismissable && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-400 mt-6"
              >
                Press ESC or click outside to dismiss
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
