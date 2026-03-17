import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type EventType = "flashcard" | "aula" | "simulado";

interface AgendaEvent {
  data: string;
  tipo: EventType;
  titulo: string;
  total_cards?: number;
  link_acesso?: string;
}

interface AgendaCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  eventsByDate: Map<string, AgendaEvent[]>;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const DOT_COLORS: Record<EventType, string> = {
  flashcard: "bg-accent",
  aula: "bg-secondary",
  simulado: "bg-destructive",
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: Array<{ date: Date; dateKey: string; isCurrentMonth: boolean }> = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, dateKey: toDateKey(d), isCurrentMonth: false });
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, dateKey: toDateKey(d), isCurrentMonth: true });
  }

  // Next month padding to fill 6 rows
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, dateKey: toDateKey(d), isCurrentMonth: false });
  }

  return days;
}

const AgendaCalendar = ({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  eventsByDate,
}: AgendaCalendarProps) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-bold text-foreground capitalize">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-px"
        >
          {days.map(({ dateKey, date, isCurrentMonth }) => {
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            const dayEvents = eventsByDate.get(dateKey);
            const eventTypes = dayEvents
              ? [...new Set(dayEvents.map((e) => e.tipo))]
              : [];

            return (
              <button
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`
                  relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-150
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isSelected
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : isToday
                      ? "bg-accent/15 text-accent font-bold"
                      : "hover:bg-muted text-foreground"
                  }
                `}
              >
                <span className="text-xs leading-none">{date.getDate()}</span>
                {/* Dot indicators */}
                {eventTypes.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {eventTypes.slice(0, 3).map((tipo) => (
                      <span
                        key={tipo}
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? "bg-primary-foreground/70" : DOT_COLORS[tipo]
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AgendaCalendar;
