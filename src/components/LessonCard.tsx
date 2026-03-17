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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
      onClick={onClick}
      className="rounded-xl border border-border bg-card px-4 py-3 cursor-pointer hover:border-secondary/40 hover:bg-secondary/5 transition-all hover:shadow-sm group flex items-center justify-between"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-secondary" />
        </div>
        <div>
          <h4 className="font-medium text-foreground text-sm leading-tight">{name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCards} card{totalCards !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
    </motion.div>
  );
};

export default LessonCard;
