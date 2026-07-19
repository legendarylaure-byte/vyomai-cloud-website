import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, RotateCcw, Sparkles, Clock, TrendingUp, ArrowRight, ArrowLeft } from "lucide-react";

interface Solution {
  title: string;
  description: string;
  match: number;
  saveHours: number;
  errorReduction: number;
  roiMonths: number;
  workflow: string[];
}

type Answer = { waste: string } | { data: string[] } | { team: string };

const wasteOptions = [
  { id: "emails", label: "Repetitive Emails", emoji: "📧" },
  { id: "data-entry", label: "Manual Data Entry", emoji: "⌨️" },
  { id: "reports", label: "Long Reports", emoji: "📊" },
  { id: "meetings", label: "Meeting Follow-ups", emoji: "🗓️" },
  { id: "sorting", label: "Document Sorting", emoji: "📁" },
];

const dataOptions = [
  { id: "text", label: "Text / Documents" },
  { id: "numbers", label: "Numbers / Spreadsheets" },
  { id: "images", label: "Images" },
  { id: "emails", label: "Emails" },
  { id: "database", label: "Database Records" },
];

const teamOptions = [
  { id: "solo", label: "Just me", sub: "1-2 people" },
  { id: "small", label: "Small team", sub: "3-10 people" },
  { id: "dept", label: "Department", sub: "11-50 people" },
  { id: "org", label: "Organization", sub: "50+ people" },
];

const solutions: Record<string, Solution> = {
  "emails-text-solo": {
    title: "Smart Email Assistant",
    description: "AI reads incoming emails, extracts key info, drafts replies, and sorts them into priority folders — all automatically.",
    match: 94, saveHours: 8, errorReduction: 82, roiMonths: 2,
    workflow: ["Inbox Scan", "AI Classification", "Auto-Draft Reply", "Priority Sort"],
  },
  "emails-text-small": {
    title: "Email Intelligence Hub",
    description: "Team-wide email automation with smart routing, response suggestions, and sentiment tracking across all conversations.",
    match: 96, saveHours: 15, errorReduction: 88, roiMonths: 2,
    workflow: ["Inbox Scan", "Team Routing", "AI Response Draft", "Sentiment Track", "Auto-Follow-up"],
  },
  "data-entry-numbers-solo": {
    title: "Data Entry Eliminator",
    description: "Paste or photograph any data — receipts, invoices, forms — and AI extracts, validates, and structures it into clean spreadsheets.",
    match: 97, saveHours: 12, errorReduction: 95, roiMonths: 1,
    workflow: ["Input Capture", "AI Extraction", "Validation", "Format Output", "Auto-Import"],
  },
  "data-entry-numbers-small": {
    title: "Automated Data Pipeline",
    description: "End-to-end data processing from multiple sources — AI extracts, cleans, validates, and pushes to your databases and spreadsheets.",
    match: 98, saveHours: 20, errorReduction: 93, roiMonths: 2,
    workflow: ["Multi-Source Input", "AI Extraction", "Cross-Validation", "Database Push", "Quality Report"],
  },
  "reports-text-dept": {
    title: "Report Auto-Generator",
    description: "AI analyzes raw data, generates executive summaries, identifies trends, and produces polished reports — monthly on autopilot.",
    match: 95, saveHours: 25, errorReduction: 85, roiMonths: 3,
    workflow: ["Data Aggregation", "Trend Analysis", "AI Summary", "Report Draft", "Auto-Distribute"],
  },
  "meetings-text-org": {
    title: "Meeting Intelligence Platform",
    description: "Auto-transcribe meetings, extract action items, assign tasks, send follow-ups, and track completion — across the entire organization.",
    match: 93, saveHours: 30, errorReduction: 80, roiMonths: 3,
    workflow: ["Live Transcription", "Action Extraction", "Task Assignment", "Follow-up Emails", "Progress Track"],
  },
  "sorting-text-solo": {
    title: "Document Smart Sorter",
    description: "AI reads, categorizes, and files documents automatically. Contracts, invoices, reports — each goes exactly where it belongs.",
    match: 92, saveHours: 6, errorReduction: 90, roiMonths: 2,
    workflow: ["Document Scan", "AI Categorize", "Metadata Extract", "Auto-File", "Search Index"],
  },
  "default": {
    title: "Custom AI Automation Suite",
    description: "A tailored combination of AI tools designed specifically for your workflow — covering extraction, classification, generation, and automation.",
    match: 88, saveHours: 14, errorReduction: 85, roiMonths: 3,
    workflow: ["Workflow Audit", "AI Tool Design", "Build & Test", "Deploy", "Optimize"],
  },
};

function getSolution(answers: { waste?: string; data?: string[]; team?: string }): Solution {
  const waste = answers.waste || "emails";
  const data = answers.data?.[0] || "text";
  const team = answers.team || "solo";
  const key = `${waste}-${data}-${team}`;
  return solutions[key] || solutions[`${waste}-${data}-solo`] || solutions[`${waste}-text-${team}`] || solutions.default;
}

export function AISolutionFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ waste?: string; data?: string[]; team?: string }>({});
  const [showResult, setShowResult] = useState(false);

  const solution = useMemo(() => getSolution(answers), [answers]);

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const selectWaste = (id: string) => {
    setAnswers((a) => ({ ...a, waste: id }));
    setStep(1);
  };

  const toggleData = (id: string) => {
    setAnswers((a) => {
      const current = a.data || [];
      const next = current.includes(id) ? current.filter((d) => d !== id) : [...current, id];
      return { ...a, data: next };
    });
  };

  const nextFromData = () => {
    if ((answers.data?.length || 0) > 0) setStep(2);
  };

  const selectTeam = (id: string) => {
    setAnswers((a) => ({ ...a, team: id }));
    setTimeout(() => setShowResult(true), 400);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
  };

  if (showResult) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="text-5xl mb-3">🎯</motion.div>
          <h3 className="text-xl font-bold gradient-brand-text mb-1">{solution.title}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{solution.description}</p>
        </div>

        {/* Match score */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              <span className="font-bold gradient-brand-text">{solution.match}%</span> match for your business
            </span>
          </motion.div>
        </div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-muted/50 border border-border/30 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1.5 text-primary" />
            <div className="text-lg font-bold text-foreground">~{solution.saveHours}h</div>
            <div className="text-[10px] text-muted-foreground">saved / week</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border/30 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-green-500" />
            <div className="text-lg font-bold text-foreground">{solution.errorReduction}%</div>
            <div className="text-[10px] text-muted-foreground">fewer errors</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border/30 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-accent" />
            <div className="text-lg font-bold text-foreground">{solution.roiMonths}mo</div>
            <div className="text-[10px] text-muted-foreground">ROI timeline</div>
          </div>
        </motion.div>

        {/* Workflow diagram */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="p-4 rounded-xl border border-border/30 bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recommended Workflow</div>
          <div className="flex items-center gap-0 overflow-x-auto">
            {solution.workflow.map((step, i) => (
              <div key={i} className="flex items-center shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary whitespace-nowrap"
                >
                  {step}
                </motion.div>
                {i < solution.workflow.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">Ready to automate? Book a free consultation with our AI team.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 focus-visible:outline-white/80 focus-visible:outline-offset-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of 3</span>
          <span>{Math.round(((step + 1) / 3) * 100)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Waste */}
        {step === 0 && (
          <motion.div key="waste" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h4 className="text-base font-bold text-foreground mb-4 text-center">What's your biggest time waste?</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wasteOptions.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectWaste(opt.id)}
                  className="p-4 rounded-xl border border-border/40 bg-background/50 text-left hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center gap-3"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Data type */}
        {step === 1 && (
          <motion.div key="data" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h4 className="text-base font-bold text-foreground mb-4 text-center">What data do you handle?</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dataOptions.map((opt) => {
                const selected = answers.data?.includes(opt.id);
                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleData(opt.id)}
                    className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      selected
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/40 bg-background/50 text-foreground hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {opt.label}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <div className="flex justify-center mt-4 gap-3">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={nextFromData}
                disabled={(answers.data?.length || 0) === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 focus-visible:outline-white/80 focus-visible:outline-offset-2 transition-all disabled:opacity-50"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Team size */}
        {step === 2 && (
          <motion.div key="team" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h4 className="text-base font-bold text-foreground mb-4 text-center">How large is your team?</h4>
            <div className="grid grid-cols-2 gap-3">
              {teamOptions.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectTeam(opt.id)}
                  className="p-4 rounded-xl border border-border/40 bg-background/50 text-center hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
