
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LaunchTimerProps {
  className?: string;
}

export function LaunchTimer({ className }: LaunchTimerProps) {
  // Target: 27th Dec 2025, 11:11 PM
  // Note: Month is 0-indexed in JS Date (0 = Jan, 11 = Dec)
  const targetDate = new Date(2025, 11, 27, 23, 11, 0).getTime();
  
  const [timeState, setTimeState] = useState<{
    diff: number;
    isPast: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    years: number;
  }>({
    diff: 0,
    isPast: false,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    years: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diffRaw = now - targetDate;
      const isPast = diffRaw >= 0;
      const diff = Math.abs(diffRaw);

      // Calculations
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeState({ diff: diffRaw, isPast, years, days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Format the main display text based on duration
  const getFormattedTime = () => {
    const { years, days, hours, minutes, seconds } = timeState;

    if (!timeState.isPast) {
      // Countdown Mode: precise T-Minus
      return `T-Minus ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    // Mission Time Mode (Count Up)
    if (years > 0) {
      // After 1 year: "1 Year, 2 Days"
      return `${years} Year${years > 1 ? 's' : ''}, ${days} Day${days !== 1 ? 's' : ''}`;
    }

    if (days > 0) {
      // Regular days count: "5 Days"
      // If it's just 1 day, "1 Day"
      return `${days} Day${days !== 1 ? 's' : ''}`;
    }

    // Less than a day: Show precise time
    // "10:30:45" (H:M:S) or similar
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    return timeState.isPast ? "Mission Time" : "Launch Target";
  };

  const getSubText = () => {
    if (timeState.isPast && timeState.days === 0 && timeState.years === 0) {
       return "Mission Active";
    }
    if (timeState.isPast) {
      // Optional: Add more flavor text if needed or just keep it simple
      return "Since Launch";
    }
    return "Tokha, Kathmandu";
  };

  return (
    <div className={cn(
      "hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-500",
      timeState.isPast 
        ? "bg-green-500/5 border-green-500/20" 
        : "bg-orange-500/5 border-orange-500/20",
      className
    )}>
      {/* Pulse Indicator */}
      <div className="relative flex h-2 w-2">
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          timeState.isPast ? "bg-green-400" : "bg-orange-400"
        )}></span>
        <span className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          timeState.isPast ? "bg-green-500" : "bg-orange-500"
        )}></span>
      </div>

      {/* Main Time Display */}
      <div className="flex flex-col leading-none">
        <span className={cn(
          "text-xs font-bold font-mono tracking-tight",
          timeState.isPast 
            ? "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
            : "bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
        )}>
          {getFormattedTime()}
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-border/50" />

      {/* Status Label */}
      <div className="flex flex-col leading-none">
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
          {getStatusText()}
        </span>
        <span className="text-[9px] font-bold text-gray-500">
           {getSubText()}
        </span>
      </div>
    </div>
  );
}
