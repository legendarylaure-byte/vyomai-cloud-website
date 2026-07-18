import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RotateCcw, Trophy, Clock, Check, Timer, ArrowRight, Flame, X } from "lucide-react";

interface ChallengeItem {
  text: string;
  category: string;
}

interface Challenge {
  title: string;
  instruction: string;
  categories: string[];
  items: ChallengeItem[];
  aiTime: string;
}

const challenges: Challenge[] = [
  {
    title: "Sort & Categorize",
    instruction: "Tap the correct category for each item as fast as you can!",
    categories: ["Finance", "Marketing", "Engineering"],
    items: [
      { text: "Invoice #4821", category: "Finance" },
      { text: "Blog post draft", category: "Marketing" },
      { text: "API endpoint fix", category: "Engineering" },
      { text: "Q3 revenue report", category: "Finance" },
      { text: "Social media calendar", category: "Marketing" },
      { text: "Database migration", category: "Engineering" },
      { text: "Expense receipt scan", category: "Finance" },
      { text: "Landing page A/B test", category: "Marketing" },
    ],
    aiTime: "0.1s",
  },
  {
    title: "Extract Key Info",
    instruction: "Find and tap the correct data type for each point. Speed matters!",
    categories: ["Name", "Date", "Amount"],
    items: [
      { text: "Client: Acme Corp", category: "Name" },
      { text: "Due: March 15", category: "Date" },
      { text: "Total: $4,250", category: "Amount" },
      { text: "Contact: Sarah Lee", category: "Name" },
      { text: "Signed: Jan 8", category: "Date" },
      { text: "Deposit: $1,200", category: "Amount" },
      { text: "Manager: Tom Chen", category: "Name" },
      { text: "Renewal: Dec 1", category: "Date" },
    ],
    aiTime: "0.05s",
  },
  {
    title: "Pattern Match",
    instruction: "Match each pair to the right category. Accuracy counts!",
    categories: ["Match A", "Match B", "Match C"],
    items: [
      { text: "Server → Backend", category: "Match A" },
      { text: "Pixel → Display", category: "Match B" },
      { text: "Algorithm → Logic", category: "Match C" },
      { text: "Database → Storage", category: "Match A" },
      { text: "Canvas → UI", category: "Match B" },
      { text: "API → Connect", category: "Match C" },
      { text: "Cache → Memory", category: "Match A" },
      { text: "Grid → Layout", category: "Match B" },
    ],
    aiTime: "0.08s",
  },
];

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AISpeedChallenge() {
  const [phase, setPhase] = useState<"start" | "play" | "ai" | "result">("start");
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(challenges[0]);
  const [sorted, setSorted] = useState<Record<string, string[]>>({});
  const [remaining, setRemaining] = useState<ChallengeItem[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [correctFlash, setCorrectFlash] = useState(false);
  const [userTime, setUserTime] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startChallenge = () => {
    const newChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setCurrentChallenge(newChallenge);
    setSorted({});
    setRemaining([...newChallenge.items].sort(() => Math.random() - 0.5));
    setWrongFlash(false);
    setCorrectFlash(false);
    setUserTime(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setPenaltyMs(0);
    setPhase("play");
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setUserTime(Date.now() - startTimeRef.current);
    }, 50);
  };

  const handleCategoryTap = (category: string) => {
    if (phase !== "play") return;

    const item = remaining[0];
    if (!item) return;

    const isCorrect = item.category === category;

    if (isCorrect) {
      setCorrectFlash(true);
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      setTimeout(() => setCorrectFlash(false), 300);

      setSorted((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), item.text],
      }));

      setRemaining((prev) => {
        const next = prev.slice(1);
        if (next.length === 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setUserTime(Date.now() - startTimeRef.current);
          setTimeout(() => setPhase("ai"), 500);
        }
        return next;
      });
    } else {
      setWrongFlash(true);
      setStreak(0);
      setPenaltyMs((p) => p + 2000);
      setTimeout(() => setWrongFlash(false), 500);
    }
  };

  const showResult = () => {
    setPhase("result");
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("start");
    setSorted({});
    setRemaining([]);
    setWrongFlash(false);
    setCorrectFlash(false);
    setUserTime(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setPenaltyMs(0);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (phase === "ai") {
      const t = setTimeout(showResult, 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "start") {
    return (
      <div className="text-center py-10 space-y-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
          <Zap className="w-10 h-10 text-primary" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">You vs AI</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try a quick sorting task, then watch AI do the same thing instantly. See the speed difference for yourself!
          </p>
        </div>
        <button
          onClick={startChallenge}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 focus-visible:outline-white/80 focus-visible:outline-offset-2 transition-all"
        >
          Start Challenge
        </button>
      </div>
    );
  }

  if (phase === "play") {
    const currentItem = remaining[0];
    const totalItems = currentChallenge.items.length;
    const doneCount = totalItems - remaining.length;
    const progress = (doneCount / totalItems) * 100;
    const displayTime = userTime + penaltyMs;

    return (
      <div className="space-y-5">
        {/* Timer + Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Timer className="w-3.5 h-3.5" />
            {currentChallenge.title}
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-500 text-xs font-bold"
              >
                <Flame className="w-3 h-3" />
                {streak}
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(displayTime)}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step counter */}
        <div className="text-center text-xs text-muted-foreground">
          {doneCount + 1} / {totalItems}
        </div>

        {/* Current item card */}
        {currentItem && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.text}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`text-center p-5 rounded-2xl border transition-all duration-200 ${
                correctFlash
                  ? "border-green-500/50 bg-green-500/10"
                  : wrongFlash
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-border/40 bg-background/50"
              }`}
            >
              <p className="text-lg font-bold text-foreground">{currentItem.text}</p>
              <p className="text-xs text-muted-foreground mt-1">Which category does this belong to?</p>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Category buttons */}
        <div className="grid grid-cols-3 gap-3">
          {currentChallenge.categories.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryTap(cat)}
              className="p-4 rounded-xl border border-border/40 bg-background/50 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-primary/80 focus-visible:outline-offset-2"
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "ai") {
    return (
      <div className="text-center py-12 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
          className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center"
        >
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="text-sm font-semibold text-foreground">AI is processing...</p>
        <p className="text-xs text-muted-foreground">
          Sorting all {currentChallenge.items.length} items instantly
        </p>
      </div>
    );
  }

  // Result phase
  const aiTimeMs = parseFloat(currentChallenge.aiTime) * 1000;
  const totalTime = userTime + penaltyMs;
  const speedup = totalTime > 0 ? Math.round(totalTime / Math.max(aiTimeMs, 1)) : 0;
  const maxTime = Math.max(totalTime, aiTimeMs);
  const userBarWidth = (totalTime / maxTime) * 100;
  const aiBarWidth = (aiTimeMs / maxTime) * 100;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-5xl mb-3">
          {speedup > 10 ? "🚀" : speedup > 5 ? "⚡" : "🎯"}
        </motion.div>
        <h3 className="text-xl font-bold gradient-brand-text mb-1">Challenge Complete!</h3>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-muted/50 border border-border/30 text-center">
          <div className="text-xs text-muted-foreground mb-1">You</div>
          <div className="text-2xl font-bold text-foreground">{formatTime(totalTime)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {correctCount}/{currentChallenge.items.length} correct
            {penaltyMs > 0 && <span className="text-red-500 ml-1">(+{formatTime(penaltyMs)} penalty)</span>}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
          <div className="text-xs text-muted-foreground mb-1">AI</div>
          <div className="text-2xl font-bold gradient-brand-text">{currentChallenge.aiTime}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {currentChallenge.items.length}/{currentChallenge.items.length} correct
          </div>
        </div>
      </div>

      {/* Bar chart comparison */}
      <div className="p-4 rounded-xl border border-border/30 bg-muted/20 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">You</span>
            <div className="flex-1 h-4 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userBarWidth}%` }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-accent/60"
              />
            </div>
            <span className="text-xs font-mono font-bold text-foreground w-14 text-right">{formatTime(totalTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">AI</span>
            <div className="flex-1 h-4 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${aiBarWidth}%` }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-green-500/60 to-green-400/60"
              />
            </div>
            <span className="text-xs font-mono font-bold text-green-500 w-14 text-right">{currentChallenge.aiTime}</span>
          </div>
        </div>
      </div>

      {/* Speedup + Streak */}
      <div className="text-center space-y-2">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-foreground">
            AI was <span className="font-bold text-primary">{speedup}x faster</span> than you
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Don't worry — humans are better at creative thinking and judgment calls.
          </p>
        </div>
        {bestStreak >= 3 && (
          <div className="p-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <p className="text-xs text-orange-500 font-semibold">
              🔥 Best streak: {bestStreak} in a row!
            </p>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground/60 mb-3">
          Imagine this saving your team hours every week.
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={startChallenge}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 focus-visible:outline-white/80 focus-visible:outline-offset-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all"
        >
          Back
        </button>
      </div>
    </motion.div>
  );
}
