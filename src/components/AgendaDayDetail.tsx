import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play, Target, CalendarX } from "lucide-react";

type EventType = "flashcard" | "aula" | "simulado";

interface AgendaEvent {
  data: string;
  tipo: EventType;
  titulo: string;
  total_cards?: number;
  link_acesso?: string;
}

const EVENT_CONFIG: Record<
  EventType,
  { icon: typeof Zap; label: string; color: string; bgColor: string; borderColor: string }
> = {
  flashcard: {
    icon: Zap,
    label: "Flashcards",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
  },
  aula: {
    icon: Play,
    label: "Aula",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
  },
  simulado: {
    icon: Target,
    label: "Simulado",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
};

interface AgendaDayDetailProps {
  selectedDate: string;
  eventos: AgendaEvent[];
}

function parseDate(dateStr: string) {
  const parts = dateStr.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatDateLabel(dateStr: string): string {
  const date = parseDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Hoje";
  if (date.getTime() === tomorrow.getTime()) return "Amanhã";
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

const AgendaDayDetail = ({ selectedDate, eventos }: AgendaDayDetailProps) => {
  const label = formatDateLabel(selectedDate);

  return (
    <div className="bg-card rounded-xl border border-border p-4 h-full">
      <h3 className="text-sm font-bold text-foreground capitalize mb-3">{label}</h3>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-2"
        >
          {eventos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CalendarX className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Nenhum evento neste dia</p>
            </div>
          ) : (
            eventos.map((evento, j) => {
              const cfg = EVENT_CONFIG[evento.tipo];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={`${evento.tipo}-${evento.titulo}-${j}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * j }}
                  className={`flex items-center justify-between text-xs p-3 rounded-lg border ${cfg.bgColor} ${cfg.borderColor}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-md ${cfg.bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-foreground font-medium truncate block">{evento.titulo}</span>
                      {evento.total_cards != null && evento.total_cards > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {evento.total_cards} cards para revisar
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.color} shrink-0 ml-2`}
                  >
                    {cfg.label}
                  </span>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AgendaDayDetail;
