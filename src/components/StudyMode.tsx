import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard, registerStudy } from "@/lib/api";
import { X, ChevronLeft, RotateCcw } from "lucide-react";
import { differenceInCalendarDays, differenceInMonths, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import StudyCompletion from "./StudyCompletion";

interface StudyModeProps {
  cards: FlashCard[];
  email: string;
  onClose: () => void;
}

function formatNextReview(dateStr: string): string {
  try {
    const next = parseISO(dateStr);
    const today = new Date();
    const days = differenceInCalendarDays(next, today);
    if (days <= 0) return "Hoje";
    if (days === 1) return "Amanhã";
    const months = differenceInMonths(next, today);
    if (months >= 1) return `em ${months} ${months === 1 ? "mês" : "meses"}`;
    return `em ${days} dias`;
  } catch {
    return dateStr;
  }
}

function formatTagLabel(tags: string | undefined): string {
  if (!tags) return "";
  const parts = tags.split("::");
  return parts[parts.length - 1]?.split(",")[0]?.trim() || "";
}

type Difficulty = "again" | "easy" | "good" | "hard";

const difficultyConfig: { value: Difficulty; label: string; color: string }[] = [
  { value: "again", label: "Errei", color: "bg-destructive hover:bg-destructive/85 text-destructive-foreground" },
  { value: "hard", label: "Difícil", color: "bg-[hsl(25,90%,50%)] hover:bg-[hsl(25,90%,45%)] text-white" },
  { value: "good", label: "Médio", color: "bg-[hsl(45,90%,50%)] hover:bg-[hsl(45,90%,45%)] text-white" },
  { value: "easy", label: "Fácil", color: "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.85)] text-white" },
];

const StudyMode = ({ cards: initialCards, email, onClose }: StudyModeProps) => {
  const [queue, setQueue] = useState<FlashCard[]>(() => [...initialCards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<Record<Difficulty, number>>({ again: 0, easy: 0, good: 0, hard: 0 });

  const card = queue[currentIndex];

  const handleAnswer = async (difficulty: Difficulty) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await registerStudy(email, card.id, difficulty);
      if (result?.proximaRevisao) {
        toast.success("Resposta registrada!", { description: `Próxima revisão: ${formatNextReview(result.proximaRevisao)}` });
      }
    } catch {
      toast.error("Erro ao registrar resposta", { description: "Tente novamente." });
    }
    setStats((s) => ({ ...s, [difficulty]: s[difficulty] + 1 }));
    setSubmitting(false);

    if (difficulty === "again") {
      setQueue((q) => [...q, { ...card }]);
    }

    if (currentIndex === queue.length - 1 && difficulty !== "again") {
      setCompleted(true);
      return;
    }
    setDirection(1);
    setFlipped(false);
    setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setDirection(-1);
    setFlipped(false);
    setCurrentIndex((i) => i - 1);
  };

  const handleRestart = () => {
    setQueue([...initialCards]);
    setCurrentIndex(0);
    setFlipped(false);
    setCompleted(false);
    setDirection(0);
    setStats({ again: 0, easy: 0, good: 0, hard: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-primary flex flex-col h-full overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0">
        <button onClick={onClose} className="text-primary-foreground/70 active:text-primary-foreground">
          <X className="w-4 h-4" />
        </button>
        {!completed && (
          <span className="text-primary-foreground/70 text-xs font-medium">
            {currentIndex + 1} / {queue.length}
          </span>
        )}
        <div className="w-4" />
      </div>

      {/* Progress bar */}
      {!completed && (
        <div className="px-3 flex-shrink-0">
          <div className="h-0.5 bg-primary-foreground/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
          </div>
        </div>
      )}

      {completed ? (
        <StudyCompletion totalCards={queue.length} stats={stats} onRestart={handleRestart} onBack={onClose} />
      ) : (
        <>
          {/* Card area */}
          <div className="flex-1 flex items-center justify-center p-3 min-h-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ x: direction * 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-lg perspective-1000 cursor-pointer max-h-full"
                onClick={() => setFlipped(!flipped)}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="relative w-full min-h-[180px] max-h-[calc(100vh-160px)]"
                >
                  {/* Front */}
                  <div
                    className="backface-hidden absolute inset-0 rounded-2xl bg-card p-5 flex flex-col justify-between overflow-y-auto transition-[visibility,opacity] duration-200"
                    style={{
                      boxShadow: "var(--shadow-elevated)",
                      visibility: flipped ? "hidden" : "visible",
                      opacity: flipped ? 0 : 1,
                    }}
                  >
                    <p className="text-foreground font-semibold text-base leading-relaxed tracking-[-0.01em]">
                      {card.frente}
                    </p>
                    <div className="flex items-center justify-between mt-3 flex-shrink-0">
                      {card.tags && (
                        <Badge variant="secondary" className="text-[10px] font-normal">{formatTagLabel(card.tags)}</Badge>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-accent ml-auto">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Toque para ver resposta</span>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="backface-hidden rotate-y-180 absolute inset-0 rounded-2xl bg-card border-2 border-accent p-5 flex flex-col justify-between overflow-y-auto transition-[visibility,opacity] duration-200"
                    style={{
                      boxShadow: "var(--shadow-elevated)",
                      visibility: flipped ? "visible" : "hidden",
                      opacity: flipped ? 1 : 0,
                    }}
                  >
                    <div>
                      <p className="text-foreground font-semibold text-base leading-relaxed tracking-[-0.01em]">{card.verso}</p>
                      {card.exemplo && (
                        <p className="text-muted-foreground text-xs mt-2 italic border-t border-border pt-2">💡 {card.exemplo}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 flex-shrink-0">
                      {card.tags && (
                        <Badge variant="secondary" className="text-[10px] font-normal">{formatTagLabel(card.tags)}</Badge>
                      )}
                      <div className="text-[10px] text-muted-foreground ml-auto">Toque para voltar</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="px-3 py-2 flex items-center justify-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-full w-8 h-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            {flipped ? (
              difficultyConfig.map((d) => (
                <Button
                  key={d.value}
                  onClick={(e) => { e.stopPropagation(); handleAnswer(d.value); }}
                  disabled={submitting}
                  className={`rounded-full h-8 px-3 font-semibold text-[11px] ${d.color}`}
                >
                  {d.label}
                </Button>
              ))
            ) : (
              <p className="text-primary-foreground/50 text-xs">Vire o card para responder</p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default StudyMode;
