import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DisciplineCardProps {
  name: string;
  totalCards: number;
  studiedCards: number;
  onClick: () => void;
  index: number;
}

const DisciplineCard = ({ name, totalCards, studiedCards, onClick, index }: DisciplineCardProps) => {
  const progress = totalCards > 0 ? Math.round((studiedCards / totalCards) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="rounded-xl bg-card border border-border p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">{name}</p>
            <p className="text-muted-foreground text-xs">
              {totalCards} card{totalCards !== 1 ? "s" : ""} disponíve{totalCards !== 1 ? "is" : "l"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </motion.div>
  );
};

export default DisciplineCard;
