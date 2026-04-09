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
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#0ea5e9", "#f59e0b", "#22c55e", "#8b5cf6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#0ea5e9", "#f59e0b", "#22c55e", "#8b5cf6"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4 mx-auto">
          <Trophy className="w-10 h-10 text-accent" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-primary-foreground mb-1">Você é Sensacional!</h2>
      <p className="text-primary-foreground/70 text-sm">Tudo revisado por hoje.</p>
      <p className="text-primary-foreground/50 text-xs mt-1">Volte amanhã para manter o ritmo!</p>

      {stats && (
        <div className="grid grid-cols-4 gap-2 mt-6 w-full max-w-xs">
          <div className="rounded-lg bg-destructive/20 p-2 text-center">
            <p className="text-destructive text-lg font-bold">{stats.again}</p>
            <p className="text-[10px] text-primary-foreground/60">Errei</p>
          </div>
          <div className="rounded-lg bg-[hsl(25,90%,50%)]/20 p-2 text-center">
            <p className="text-[hsl(25,90%,50%)] text-lg font-bold">{stats.hard}</p>
            <p className="text-[10px] text-primary-foreground/60">Difícil</p>
          </div>
          <div className="rounded-lg bg-[hsl(45,90%,50%)]/20 p-2 text-center">
            <p className="text-[hsl(45,90%,50%)] text-lg font-bold">{stats.good}</p>
            <p className="text-[10px] text-primary-foreground/60">Médio</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--success))]/20 p-2 text-center">
            <p className="text-[hsl(var(--success))] text-lg font-bold">{stats.easy}</p>
            <p className="text-[10px] text-primary-foreground/60">Fácil</p>
          </div>
        </div>
      )}

      <p className="text-primary-foreground/50 text-xs mt-4">
        Você revisou {totalCards} card{totalCards !== 1 ? "s" : ""} nesta sessão.
      </p>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack} className="rounded-lg border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <Button onClick={onRestart} className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/85">
          <RotateCcw className="w-4 h-4 mr-1" />
          Repetir
        </Button>
      </div>
    </div>
  );
};

export default StudyCompletion;
