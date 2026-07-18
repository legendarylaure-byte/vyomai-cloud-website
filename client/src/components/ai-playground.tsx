import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Copy, Check, RotateCcw, Loader2, Sparkles, Clock, Trash2 } from "lucide-react";

const suggestions = [
  { label: "Tech Startup", value: "TechVenture" },
  { label: "Coffee Shop", value: "Brew & Bean" },
  { label: "Fitness Brand", value: "FitPulse" },
  { label: "AI Company", value: "VyomAi" },
  { label: "Green Energy", value: "SolarTech" },
];

const HISTORY_KEY = "vyomai-tagline-history";
const MAX_HISTORY = 5;

interface HistoryEntry {
  input: string;
  output: string;
  timestamp: number;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

export function AIPlayground() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const generate = useCallback(async (overrideInput?: string) => {
    const targetInput = overrideInput || input;
    if (!targetInput.trim() || isStreaming) return;
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setOutput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/ai/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tagline", input: targetInput.trim() }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                setOutput((prev) => prev + data.text);
                fullText += data.text;
              }
              if (data.type === "done") {
                setIsStreaming(false);
                if (fullText) {
                  const entry: HistoryEntry = {
                    input: targetInput.trim(),
                    output: fullText,
                    timestamp: Date.now(),
                  };
                  const newHistory = [entry, ...loadHistory().filter((h) => h.input !== entry.input)].slice(0, MAX_HISTORY);
                  saveHistory(newHistory);
                  setHistory(newHistory);
                }
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setIsStreaming(false);
    }
  }, [input, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setInput("");
    setOutput("");
    if (abortRef.current) abortRef.current.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setInput(entry.input);
    setOutput(entry.output);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Company / Product name</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. VyomAi, SolarTech, GreenLeaf..."
          className="w-full rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.value}
              onClick={() => { setInput(s.value); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => generate()}
            disabled={!input.trim() || isStreaming}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 focus-visible:outline-white/80 focus-visible:outline-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            {isStreaming ? "Generating..." : "Generate Taglines"}
          </button>
          {(input || output) && (
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="relative rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Generated Taglines
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {output}
              {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse rounded-sm align-middle" />}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && !output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent
            </span>
            <button
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <div className="space-y-1.5">
            {history.slice(0, 3).map((entry, i) => (
              <button
                key={i}
                onClick={() => loadFromHistory(entry)}
                className="w-full text-left p-3 rounded-xl border border-border/30 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{entry.input}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{entry.output}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground/60">
          Want custom AI tools like this? VyomAi builds them for businesses.
        </p>
      </div>
    </div>
  );
}
