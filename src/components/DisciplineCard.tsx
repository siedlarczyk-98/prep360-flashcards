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
      transition={{ delay: 0.05 * index }}
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-accent/40 transition-all hover:shadow-md group"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCards} card{totalCards !== 1 ? "s" : ""} disponíve{totalCards !== 1 ? "is" : "l"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0 mt-1" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </motion.div>
  );
};

export default DisciplineCard;
