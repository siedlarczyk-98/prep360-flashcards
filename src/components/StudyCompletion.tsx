import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface StudyCompletionProps {
  totalCards: number;
  stats?: { again: number; easy: number; good: number; hard: number };
  onRestart: () => void;
  onBack: () => void;
}

const StudyCompletion = ({ totalCards, stats, onRestart, onBack }: StudyCompletionProps) => {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ["#0ea5e9", "#f59e0b", "#22c55e", "#8b5cf6"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ["#0ea5e9", "#f59e0b", "#22c55e", "#8b5cf6"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center text-center px-4 py-6 flex-1"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}
        className="relative mb-5"
      >
        <div className="absolute inset-0 rounded-full bg-[hsl(var(--warning))] blur-[30px] opacity-30 scale-150" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(32,95%,44%)] flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-extrabold text-primary-foreground mb-1 tracking-tight"
      >
        Você é Sensacional!
      </motion.h2>

      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-primary-foreground/80 text-sm mb-1">
        Tudo revisado por hoje.
      </motion.p>

      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-primary-foreground/50 text-xs mb-4">
        Volte amanhã para manter o ritmo!
      </motion.p>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex gap-5 mb-5">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-destructive">{stats.again}</span>
            <span className="text-[10px] text-primary-foreground/50 mt-0.5">Errei</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[hsl(25,90%,50%)]">{stats.hard}</span>
            <span className="text-[10px] text-primary-foreground/50 mt-0.5">Difícil</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[hsl(45,90%,50%)]">{stats.good}</span>
            <span className="text-[10px] text-primary-foreground/50 mt-0.5">Médio</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-[hsl(var(--success))]">{stats.easy}</span>
            <span className="text-[10px] text-primary-foreground/50 mt-0.5">Fácil</span>
          </div>
        </motion.div>
      )}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-primary-foreground/60 text-xs mb-5">
        Você revisou <span className="text-accent font-semibold">{totalCards}</span> card{totalCards !== 1 ? "s" : ""} nesta sessão.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
        <Button onClick={onBack} className="flex-1 h-10 gap-2 bg-accent text-accent-foreground hover:bg-[hsl(199,80%,55%)] font-bold text-sm rounded-xl shadow-lg">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={onRestart} variant="outline" className="h-10 gap-2 border-primary-foreground/40 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 font-semibold rounded-xl px-5 text-sm">
          <RotateCcw className="w-3.5 h-3.5" />
          Repetir
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default StudyCompletion;
