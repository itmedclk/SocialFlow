import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface StepProps {
  label: string;
  status: "pending" | "active" | "completed" | "error";
  description?: string;
  index: number;
}

interface PipelineVisualizerProps {
  isRunning?: boolean;
  onComplete?: () => void;
}

const INITIAL_STEPS: StepProps[] = [
  { label: "Cron Trigger", status: "pending", description: "Waiting...", index: 0 },
  { label: "RSS Feed", status: "pending", description: "Google News", index: 1 },
  { label: "Dedupe Filter", status: "pending", description: "Check History", index: 2 },
  { label: "AI Generation", status: "pending", description: "Caption & Tags", index: 3 },
  { label: "Safety Check", status: "pending", description: "Claims & Len", index: 4 },
  { label: "App Log", status: "pending", description: "Save JSON", index: 5 },
  { label: "Image Search", status: "pending", description: "Source API", index: 6 },
  { label: "Postly Sched", status: "pending", description: "11:00 PST", index: 7 },
];

export function PipelineVisualizer({ isRunning = false, onComplete }: PipelineVisualizerProps) {
  const [steps, setSteps] = useState<StepProps[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (isRunning) {
      setCurrentStep(0);
      setSteps(INITIAL_STEPS);
    }
  }, [isRunning]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      // Set current to active
      setSteps(prev => prev.map((s, i) => 
        i === currentStep ? { ...s, status: "active", description: "Processing..." } : s
      ));

      // Simulate processing time
      const timer = setTimeout(() => {
        setSteps(prev => prev.map((s, i) => 
          i === currentStep ? { ...s, status: "completed", description: "Done" } : s
        ));
        setCurrentStep(prev => prev + 1);
      }, 1500); // 1.5s per step

      return () => clearTimeout(timer);
    } else if (currentStep === steps.length) {
      if (onComplete) onComplete();
      setCurrentStep(-1);
    }
  }, [currentStep, steps.length, onComplete]);

  return (
    <div className="w-full overflow-x-auto pb-6 -mx-6 px-6 md:mx-0 md:px-0">
      <div className="min-w-max flex items-center gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative group flex flex-col items-center justify-center w-40 h-32 rounded-2xl border-2 transition-all duration-300",
                step.status === "active" && "bg-primary/5 border-primary shadow-[0_0_20px_-5px_var(--color-primary)] scale-105",
                step.status === "completed" && "bg-card border-primary/20",
                step.status === "pending" && "bg-muted/30 border-muted-foreground/10 opacity-60",
                step.status === "error" && "bg-destructive/5 border-destructive shadow-[0_0_20px_-5px_var(--color-destructive)]"
              )}
            >
              {step.status === "active" && (
                <span className="absolute -top-3 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full tracking-wider uppercase shadow-md animate-pulse">
                  Processing
                </span>
              )}
              
              <div className="mb-3">
                {step.status === "completed" && <CheckCircle2 className="h-8 w-8 text-primary" />}
                {step.status === "active" && <ActivityIcon />}
                {step.status === "pending" && <Circle className="h-8 w-8 text-muted-foreground" />}
                {step.status === "error" && <XCircle className="h-8 w-8 text-destructive" />}
              </div>

              <div className="text-center">
                <p className={cn(
                  "font-bold text-sm",
                  step.status === "active" ? "text-primary" : "text-foreground"
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{step.description}</p>
              </div>
            </motion.div>
            
            {i < steps.length - 1 && (
              <div className="w-8 flex justify-center">
                <ArrowRight className={cn(
                  "h-5 w-5",
                  step.status === "completed" ? "text-primary/50" : "text-muted-foreground/20"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityIcon() {
  return (
    <div className="relative h-8 w-8 flex items-center justify-center">
      <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
      <div className="absolute inset-0 border-2 border-primary rounded-full animate-spin border-t-transparent" />
    </div>
  );
}