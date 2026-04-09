import { useState } from "react";
import { motion } from "framer-motion";
import { FlashCard } from "@/lib/api";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatTagLabel(tag: string | undefined): string {
  if (!tag) return "";
  const parts = tag.split("::");
  return parts[parts.length - 1]?.split(",")[0]?.trim() || "";
}

const FlashCardItem = ({ card }: { card: FlashCard }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="perspective-1000 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full min-h-[120px]"
      >
        {/* Front */}
        <div
          className="backface-hidden absolute inset-0 rounded-xl bg-card border border-border p-4 flex flex-col justify-between transition-[visibility,opacity] duration-200"
          style={{
            boxShadow: "var(--shadow-card)",
            visibility: flipped ? "hidden" : "visible",
            opacity: flipped ? 0 : 1,
          }}
        >
          <p className="text-foreground font-medium text-sm leading-relaxed">{card.front}</p>
          <div className="flex items-center justify-between mt-3">
            {card.tag_cont && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                {formatTagLabel(card.tag_cont)}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-[10px] text-accent ml-auto">
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Toque para virar</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="backface-hidden rotate-y-180 absolute inset-0 rounded-xl bg-card border-2 border-accent p-4 flex flex-col justify-between transition-[visibility,opacity] duration-200"
          style={{
            boxShadow: "var(--shadow-card)",
            visibility: flipped ? "visible" : "hidden",
            opacity: flipped ? 1 : 0,
          }}
        >
          <div>
            <p className="text-foreground font-medium text-sm leading-relaxed">{card.back}</p>
            {card.example && (
              <p className="text-muted-foreground text-xs mt-2 italic border-t border-border pt-2">
                💡 {card.example}
              </p>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 text-right">Toque para voltar</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlashCardItem;
