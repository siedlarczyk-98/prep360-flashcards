import { useState } from "react";
import { motion } from "framer-motion";
import { FlashCard } from "@/lib/api";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FlashCardItemProps {
  card: FlashCard;
}

function formatTagLabel(tags: string | undefined): string {
  if (!tags) return "";
  const parts = tags.split("::");
  return parts[parts.length - 1]?.split(",")[0]?.trim() || "";
}

const FlashCardItem = ({ card }: FlashCardItemProps) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 cursor-pointer w-full"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full min-h-[200px]"
      >
        {/* Front */}
        <div
          className="backface-hidden absolute inset-0 rounded-xl border border-border bg-card p-6 flex flex-col justify-between"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-foreground font-semibold text-lg leading-relaxed">{card.frente}</p>
          <div className="flex items-center justify-between mt-4">
            {card.tags && (
              <Badge variant="secondary" className="text-xs font-normal">
                {formatTagLabel(card.tags)}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-accent ml-auto">
              <RotateCcw className="w-3 h-3" />
              <span>Toque para virar</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="backface-hidden rotate-y-180 absolute inset-0 rounded-xl border border-accent bg-primary p-6 flex flex-col justify-between"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div>
            <p className="text-primary-foreground font-semibold text-lg leading-relaxed">{card.verso}</p>
            {card.exemplo && (
              <p className="text-primary-foreground/70 text-sm mt-4 italic border-t border-primary-foreground/20 pt-3">
                💡 {card.exemplo}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-primary-foreground/50 mt-4">
            <RotateCcw className="w-3 h-3" />
            <span>Toque para voltar</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashCardItem;
