import { motion } from "framer-motion";
import { FileText, ChevronRight } from "lucide-react";

interface LessonCardProps {
  name: string;
  totalCards: number;
  onClick: () => void;
  index: number;
}

const LessonCard = ({ name, totalCards, onClick, index }: LessonCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="rounded-xl bg-card border border-border p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-between"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-foreground font-medium text-sm">{name}</p>
          <p className="text-muted-foreground text-xs">
            {totalCards} card{totalCards !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.div>
  );
};

export default LessonCard;
