import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  variant?: "header" | "login" | "footer" | "admin" | "minimal" | "copyright" | "brandShowcase";
  className?: string;
  showText?: boolean;
}

export function AnimatedLogo({ 
  variant = "header", 
  className,
  showText = true 
}: AnimatedLogoProps) {
  const sizeConfig = {
    header: { fontSize: "text-2xl", iconSize: 38, gap: "gap-2", flexDir: "flex-row" as const },
    login: { fontSize: "text-5xl", iconSize: 90, gap: "gap-4", flexDir: "flex-col" as const },
    footer: { fontSize: "text-xl", iconSize: 34, gap: "gap-2", flexDir: "flex-row" as const },
    admin: { fontSize: "text-lg", iconSize: 28, gap: "gap-2", flexDir: "flex-row" as const },
    minimal: { fontSize: "text-base", iconSize: 22, gap: "gap-1", flexDir: "flex-row" as const },
    copyright: { fontSize: "text-sm", iconSize: 20, gap: "gap-1", flexDir: "flex-row" as const },
    brandShowcase: { fontSize: "text-4xl", iconSize: 70, gap: "gap-4", flexDir: "flex-col" as const },
  };

  const config = sizeConfig[variant];

  return (
    <motion.div 
      className={cn(
        "flex items-center", 
        config.gap, 
        config.flexDir,
        variant === "login" && "text-center",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <LogoIcon size={config.iconSize} variant={variant} />
      
      {showText && (
        <div className={cn("flex flex-col", (variant === "login" || variant === "brandShowcase") && "items-center mt-2")}>
          <AnimatedLogoText variant={variant} fontSize={config.fontSize} />
          {variant === "login" && (
            <motion.span 
              className="text-xs text-muted-foreground/70 tracking-[0.25em] font-light uppercase mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              The Infinity Sky
            </motion.span>
          )}
          {variant === "brandShowcase" && (
            <motion.div
              className="flex flex-col items-center mt-3 max-w-lg text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                VyomAi Cloud Pvt. Ltd
              </span>
              <span className="text-xs text-muted-foreground/70 tracking-[0.2em] font-light uppercase mb-3">
                The Infinity Sky
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pioneering AI technology from the heart of the Himalayas. Bringing intelligent solutions to businesses worldwide.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function LogoIcon({ size, variant }: { size: number; variant: string }) {
  const isLarge = variant === "login" || variant === "brandShowcase";
  
  return (
    <motion.div 
      className="relative"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {isLarge && (
        <motion.div
          className="absolute inset-[-8px] rounded-full"
          animate={{
            boxShadow: [
              "0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)",
              "0 0 50px rgba(139, 92, 246, 0.6), 0 0 100px rgba(249, 115, 22, 0.3)",
              "0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      <motion.svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none"
        className="relative z-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id={`gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
            <stop offset="50%" stopColor="hsl(280, 80%, 55%)" />
            <stop offset="100%" stopColor="hsl(24, 95%, 53%)" />
          </linearGradient>
        </defs>
        
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke={`url(#gradient-${variant})`}
          strokeWidth="3"
          fill="none"
        />
        
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          stroke={`url(#gradient-${variant})`}
          strokeWidth="1.5"
          strokeDasharray="6 3"
          fill="none"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%", transformOrigin: "center" }}
        />
        
        <motion.path
          d="M35 65 L50 35 L65 65"
          stroke={`url(#gradient-${variant})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%", transformOrigin: "center" }}
        />
        
        {isLarge && (
          <>
            <motion.circle
              cx="15"
              cy="25"
              r="3"
              fill="hsl(262, 83%, 58%)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5], rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "50px", originY: "50px", transformOrigin: "50px 50px" }}
            />
            <motion.circle
              cx="85"
              cy="30"
              r="2.5"
              fill="hsl(24, 95%, 53%)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5], rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              style={{ originX: "50px", originY: "50px", transformOrigin: "50px 50px" }}
            />
            <motion.circle
              cx="80"
              cy="75"
              r="2"
              fill="hsl(280, 80%, 55%)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5], rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              style={{ originX: "50px", originY: "50px", transformOrigin: "50px 50px" }}
            />
            <motion.circle
              cx="20"
              cy="70"
              r="2"
              fill="hsl(262, 83%, 58%)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5], rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              style={{ originX: "50px", originY: "50px", transformOrigin: "50px 50px" }}
            />
          </>
        )}
      </motion.svg>
    </motion.div>
  );
}

function AnimatedLogoText({ variant, fontSize }: { variant: string; fontSize: string }) {
  const isLarge = variant === "login";
  
  const letterVariants = {
    initial: { opacity: 0, y: 15 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.06,
        duration: 0.35,
        ease: "easeOut",
      },
    }),
  };

  const letters = [
    { char: "V", special: false },
    { char: "Y", special: false },
    { char: "O", special: false },
    { char: "M", special: true },
    { char: "A", special: false },
    { char: "I", special: false },
  ];

  return (
    <motion.div 
      className={cn("flex items-center font-bold font-[Space_Grotesk]", fontSize)}
      initial="initial"
      animate="animate"
    >
      {letters.map((letter, i) => (
        letter.special ? (
          <motion.span
            key={i}
            className="inline-block relative mx-[1px]"
            custom={i}
            variants={letterVariants}
          >
            <motion.span
              className="inline-block"
              animate={{
                rotateY: [0, 180, 360],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 4,
              }}
              style={{ 
                transformStyle: "preserve-3d",
                perspective: "800px",
                display: "inline-block",
              }}
            >
              <motion.span
                className="bg-gradient-to-r from-accent via-purple-400 to-primary bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 4,
                }}
                style={{ backgroundSize: "200% 200%" }}
              >
                {letter.char}
              </motion.span>
            </motion.span>
            {isLarge && (
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-primary rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 4,
                }}
              />
            )}
          </motion.span>
        ) : (
          <motion.span
            key={i}
            className="inline-block bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent"
            custom={i}
            variants={letterVariants}
          >
            {letter.char}
          </motion.span>
        )
      ))}
    </motion.div>
  );
}

export function MiniLogo({ className }: { className?: string }) {
  return (
    <motion.span 
      className={cn("inline-flex items-center gap-1.5", className)}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <motion.svg 
        width="22" 
        height="22" 
        viewBox="0 0 100 100" 
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
            <stop offset="100%" stopColor="hsl(24, 95%, 53%)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="44" stroke="url(#miniGradient)" strokeWidth="4" fill="none" />
        <motion.path 
          d="M35 65 L50 35 L65 65" 
          stroke="url(#miniGradient)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%", transformOrigin: "center" }}
        />
      </motion.svg>
      <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-[Space_Grotesk]">
        VyomAi
      </span>
    </motion.span>
  );
}

export function AnimatedLogoShimmer({ className }: { className?: string }) {
  return (
    <motion.div 
      className={cn("relative overflow-hidden flex items-center gap-2", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
            <stop offset="100%" stopColor="hsl(24, 95%, 53%)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="44" stroke="url(#shimmerGradient)" strokeWidth="4" fill="none" />
        <path d="M35 65 L50 35 L65 65" stroke="url(#shimmerGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-[Space_Grotesk]">
        VyomAi
      </span>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 3,
        }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }}
      />
    </motion.div>
  );
}
