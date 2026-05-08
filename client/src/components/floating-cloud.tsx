import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface AudioContext_Type {
  context: AudioContext | null;
  buffer: AudioBuffer | null;
  gainNode: GainNode | null;
}

interface FloatingIconProps {
  onClick: () => void;
  isOpen: boolean;
  message?: string;
  isVisible?: boolean;
}

export function FloatingCloud({ 
  onClick, 
  isOpen, 
  message = "Click for Premium price", 
  isVisible = true
}: FloatingIconProps) {
  const [location] = useLocation();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<AudioContext_Type>({ context: null, buffer: null, gainNode: null });
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });

  const PADDING = 60;

  // Generate random target within bounds
  const generateRandomTarget = () => {
    const maxX = containerSize.width - PADDING * 2;
    const maxY = containerSize.height - PADDING * 2;
    const x = Math.random() * maxX + PADDING;
    const y = Math.random() * maxY + PADDING;
    return { x, y };
  };

  // Set new random target every 6 seconds, but NOT when hovering or dialog is open
  useEffect(() => {
    if (isHovered || isOpen) return; // Don't update target when interacting
    
    setTargetPosition(generateRandomTarget());
    const interval = setInterval(() => {
      setTargetPosition(generateRandomTarget());
    }, 6000);
    return () => clearInterval(interval);
  }, [containerSize, isHovered, isOpen]);

  // Smooth interpolation toward target (ONLY when not hovered)
  useEffect(() => {
    if (isHovered || isOpen) return; // Don't interpolate when hovering or dialog open
    
    const animationFrame = setInterval(() => {
      setPosition((prev) => ({
        x: prev.x + (targetPosition.x - prev.x) * 0.025,
        y: prev.y + (targetPosition.y - prev.y) * 0.025,
      }));
    }, 40);
    return () => clearInterval(animationFrame);
  }, [targetPosition, isHovered, isOpen]);

  // Create heartbeat sound
  const createHeartbeatSound = (context: AudioContext): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const duration = 1.2;
    const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const beatDuration = 0.15;
    const beatFrequency = 100;
    const volume = 0.25; // Increased from 0.12 for louder heartbeat sound

    for (let i = 0; i < sampleRate * beatDuration; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 6);
      const freq = beatFrequency * (1 + t * 0.5);
      data[i] += Math.sin(2 * Math.PI * freq * t) * decay * volume;
    }

    const startSample = Math.floor(sampleRate * 0.5);
    for (let i = 0; i < sampleRate * beatDuration; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 8);
      data[startSample + i] += Math.sin(2 * Math.PI * beatFrequency * 0.9 * t) * decay * (volume * 0.8);
    }

    return buffer;
  };

  // Initialize audio context on first user interaction or immediately
  const initAudioContext = () => {
    try {
      if (!audioRef.current.context) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.75; // Significantly increased volume for louder heartbeat
        gainNode.connect(audioContext.destination);
        const heartbeatBuffer = createHeartbeatSound(audioContext);
        audioRef.current = { context: audioContext, buffer: heartbeatBuffer, gainNode };
        console.log("Audio context initialized successfully");
        return true;
      }
      return true;
    } catch (e) {
      console.log("Web Audio API not available:", e);
      return false;
    }
  };

  useEffect(() => {
    // Try to initialize on component mount
    initAudioContext();
    
    // Also initialize on first user interaction (for browsers with strict autoplay policies)
    const initOnInteraction = () => {
      initAudioContext();
      document.removeEventListener("click", initOnInteraction);
      document.removeEventListener("touchstart", initOnInteraction);
    };
    
    document.addEventListener("click", initOnInteraction);
    document.addEventListener("touchstart", initOnInteraction);
    
    return () => {
      document.removeEventListener("click", initOnInteraction);
      document.removeEventListener("touchstart", initOnInteraction);
    };
  }, []);

  const playSound = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    // Ensure audio context is initialized
    if (!audioRef.current.context) {
      initAudioContext();
    }

    if (audioRef.current.context && audioRef.current.buffer && audioRef.current.gainNode) {
      try {
        // Resume audio context if it's suspended (common on mobile/modern browsers)
        if (audioRef.current.context.state === "suspended") {
          audioRef.current.context.resume();
        }
        
        const source = audioRef.current.context.createBufferSource();
        source.buffer = audioRef.current.buffer;
        source.connect(audioRef.current.gainNode);
        source.loop = true;
        source.start(0);
        currentSourceRef.current = source;
        isPlayingRef.current = true;
        console.log("Heartbeat sound playing");
      } catch (e) {
        console.log("Error playing sound:", e);
      }
    } else {
      console.log("Audio not ready:", { context: !!audioRef.current.context, buffer: !!audioRef.current.buffer, gainNode: !!audioRef.current.gainNode });
    }
  };

  const stopSound = () => {
    if (currentSourceRef.current && isPlayingRef.current) {
      try {
        currentSourceRef.current.stop();
        isPlayingRef.current = false;
        currentSourceRef.current = null;
      } catch (e) {
        // Already stopped
      }
    }
  };

  useEffect(() => {
    if (location === "/" && isVisible && !isHovered && !isOpen) {
      if (!delayTimeoutRef.current) {
        delayTimeoutRef.current = setTimeout(() => {
          playSound();
        }, 2500);
      }
    } else {
      stopSound();
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    }

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    };
  }, [location, isVisible, isHovered, isOpen]);

  if (!isVisible || location !== "/") return null;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      onMouseEnter={() => setContainerSize(prev => ({ ...prev }))}
      data-testid="container-floating-cloud"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* Floating icon + text unit */}
      <motion.div
        className="absolute cursor-pointer z-20 flex flex-col items-center gap-3 pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
        whileHover={{ scale: 1.15 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        data-testid="button-floating-premium-icon"
      >
        {/* Glowing orb */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 blur-xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-orange-400/40"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          {/* Core */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 shadow-2xl" />
          {/* Shine */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/60 blur-sm" />
        </div>

        {/* Text label */}
        <motion.div
          className="text-center whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs font-semibold text-primary uppercase tracking-widest drop-shadow-lg">
            Contact VyomAi
          </div>
          <div className="text-[10px] text-primary/70 font-medium drop-shadow">
            for Premium Package
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
