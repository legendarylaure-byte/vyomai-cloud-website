import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Database, FileText, Play, RotateCcw, Settings2, Check, ChevronRight, Gauge } from "lucide-react";

interface WorkflowStep {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
}

interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: WorkflowStep[];
  savings: string;
}

const templates: WorkflowTemplate[] = [
  {
    id: "email",
    title: "Email Triage",
    description: "Auto-sort, classify & respond to incoming emails",
    icon: <Mail className="w-5 h-5" />,
    savings: "~12 hrs/week",
    steps: [
      { id: "inbox", icon: <Mail className="w-4 h-4" />, label: "Inbox", description: "Scan incoming emails", active: true },
      { id: "classify", icon: <span className="text-[10px] font-bold">AI</span>, label: "Classify", description: "AI categorizes by type & urgency", active: true },
      { id: "priority", icon: <span className="text-[10px] font-bold">AI</span>, label: "Priority Sort", description: "Rank by importance & deadline", active: true },
      { id: "route", icon: <ChevronRight className="w-4 h-4" />, label: "Auto-Route", description: "Send to right team member", active: true },
      { id: "reply", icon: <Check className="w-4 h-4" />, label: "Auto-Reply", description: "Draft contextual responses", active: true },
    ],
  },
  {
    id: "data",
    title: "Data Pipeline",
    description: "Extract, validate & structure raw data automatically",
    icon: <Database className="w-5 h-5" />,
    savings: "~8 hrs/week",
    steps: [
      { id: "raw", icon: <Database className="w-4 h-4" />, label: "Raw Data", description: "Ingest from multiple sources", active: true },
      { id: "extract", icon: <span className="text-[10px] font-bold">AI</span>, label: "Extract", description: "AI pulls key fields & values", active: true },
      { id: "validate", icon: <Check className="w-4 h-4" />, label: "Validate", description: "Check data integrity & format", active: true },
      { id: "structure", icon: <span className="text-[10px] font-bold">AI</span>, label: "Structure", description: "Organize into clean schema", active: true },
      { id: "output", icon: <FileText className="w-4 h-4" />, label: "Clean CSV", description: "Export ready-to-use data", active: true },
    ],
  },
  {
    id: "doc",
    title: "Doc Processing",
    description: "Analyze, summarize & extract action items from documents",
    icon: <FileText className="w-5 h-5" />,
    savings: "~6 hrs/week",
    steps: [
      { id: "upload", icon: <FileText className="w-4 h-4" />, label: "Document", description: "Upload PDF, DOCX, or scan", active: true },
      { id: "analyze", icon: <span className="text-[10px] font-bold">AI</span>, label: "Analyze", description: "AI reads & understands content", active: true },
      { id: "summarize", icon: <span className="text-[10px] font-bold">AI</span>, label: "Summarize", description: "Generate executive summary", active: true },
      { id: "actions", icon: <Check className="w-4 h-4" />, label: "Action Items", description: "Extract tasks & deadlines", active: true },
      { id: "notify", icon: <Mail className="w-4 h-4" />, label: "Notify Team", description: "Send summary to stakeholders", active: true },
    ],
  },
];

const speedOptions = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
];

export function AIWorkflowVisualizer() {
  const [selected, setSelected] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const template = templates.find((t) => t.id === selected);

  const selectTemplate = (id: string) => {
    const t = templates.find((tpl) => tpl.id === id);
    if (t) {
      setSelected(id);
      setSteps(t.steps.map((s) => ({ ...s, active: true })));
      setActiveStep(-1);
      setCompleted(false);
      setRunning(false);
      setCustomize(false);
      setHoveredStep(null);
    }
  };

  const toggleStep = (stepId: string) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, active: !s.active } : s)));
  };

  const runWorkflow = useCallback(() => {
    if (running) return;
    const activeSteps = steps.filter((s) => s.active);
    if (activeSteps.length === 0) return;

    setRunning(true);
    setCompleted(false);
    setActiveStep(0);

    let idx = 0;
    const baseDelay = 700;
    const advance = () => {
      idx++;
      if (idx < activeSteps.length) {
        setActiveStep(idx);
        runTimer.current = setTimeout(advance, baseDelay / speed);
      } else {
        setRunning(false);
        setCompleted(true);
      }
    };
    runTimer.current = setTimeout(advance, baseDelay / speed);
  }, [running, steps, speed]);

  const reset = () => {
    if (runTimer.current) clearTimeout(runTimer.current);
    setSelected(null);
    setSteps([]);
    setActiveStep(-1);
    setCompleted(false);
    setRunning(false);
    setCustomize(false);
    setHoveredStep(null);
  };

  useEffect(() => {
    return () => { if (runTimer.current) clearTimeout(runTimer.current); };
  }, []);

  if (!selected || !template) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Settings2 className="w-3.5 h-3.5" />
          Pick a Workflow
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectTemplate(t.id)}
              className="p-4 rounded-xl border border-border/40 bg-background/50 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                {t.icon}
              </div>
              <div className="font-semibold text-sm text-foreground mb-1">{t.title}</div>
              <div className="text-xs text-muted-foreground mb-2">{t.description}</div>
              <div className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">Saves {t.savings}</div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const activeSteps = steps.filter((s) => s.active);
  const activeIdx = running ? activeSteps.findIndex((s) => s.id === activeSteps[activeStep]?.id) : -1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
          {template.title} Pipeline
        </div>
        <div className="flex items-center gap-2">
          {/* Speed control */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 border border-border/30">
            <Gauge className="w-3 h-3 text-muted-foreground" />
            {speedOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  speed === opt.value ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCustomize(!customize)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${customize ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground border border-border/30"}`}
          >
            <Settings2 className="w-3 h-3" />
            Customize
          </button>
        </div>
      </div>

      {/* Customize toggles */}
      <AnimatePresence>
        {customize && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  step.active
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-muted/50 text-muted-foreground border-border/30 line-through opacity-60"
                }`}
              >
                {step.icon}
                {step.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline visualization */}
      <div className="relative p-5 rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {activeSteps.map((step, i) => {
            const isRunning = running && i === activeIdx;
            const isDone = completed || (running && i < activeIdx);
            return (
              <div key={step.id} className="flex items-center shrink-0 relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-300 min-w-[80px] cursor-default ${
                    isRunning
                      ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/15"
                      : isDone
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-border/40 bg-background/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isRunning ? "bg-primary/25 text-primary" : isDone ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${isRunning ? "text-primary" : isDone ? "text-green-500" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                  {isRunning && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                      layoutId="workflow-active"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>

                {/* Step tooltip */}
                <AnimatePresence>
                  {hoveredStep === step.id && !running && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-foreground text-background text-[10px] font-medium whitespace-nowrap z-10"
                    >
                      {step.description}
                    </motion.div>
                  )}
                </AnimatePresence>

                {i < activeSteps.length - 1 && (
                  <div className={`w-8 h-px mx-0.5 transition-colors duration-300 ${isDone ? "bg-green-500/50" : "bg-border/40"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Flow particles */}
        {running && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(138,80,232,0.4)]"
            animate={{ left: ["10%", "90%"] }}
            transition={{ duration: (activeSteps.length * 0.7) / speed, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Step counter during run */}
      {running && activeStep >= 0 && activeStep < activeSteps.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground">
            Step <span className="font-bold text-primary">{activeStep + 1}</span> / {activeSteps.length} —{" "}
            <span className="font-semibold text-foreground">{activeSteps[activeStep].label}</span>
            <span className="text-muted-foreground ml-1">({activeSteps[activeStep].description})</span>
          </p>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-foreground">Workflow Complete</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This automated pipeline saves approximately <span className="text-primary font-semibold">{template.savings}</span> compared to manual processing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={runWorkflow}
          disabled={running || activeSteps.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 focus-visible:outline-white/80 focus-visible:outline-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          {running ? "Running..." : "Run Workflow"}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground/60">
          Want this for your workflow? VyomAi builds custom AI pipelines for businesses.
        </p>
      </div>
    </div>
  );
}
