import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgendaCompleta } from "@/lib/api";
import { useEmbedNavigate } from "@/hooks/useEmbedNavigate";
import { Calendar, Zap, Play, Target, Trophy } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AgendaCalendar from "@/components/AgendaCalendar";
import AgendaDayDetail from "@/components/AgendaDayDetail";
import { motion } from "framer-motion";

type EventType = "flashcard" | "aula" | "simulado";
type FilterType = "todos" | EventType;

interface AgendaEvent {
  data: string;
  tipo: EventType;
  titulo: string;
  total_cards?: number;
  link_acesso?: string;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDataCurta(dateStr: string): string {
  const parts = dateStr.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function diasRestantes(dateStr: string): number {
  const parts = dateStr.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const Agenda = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("todos");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [currentPage, setCurrentPage] = useState(1);

  const email = localStorage.getItem("userEmail") || "";

  const { data: agendaData, isLoading } = useQuery({
    queryKey: ["agenda-completa", email, currentPage],
    queryFn: () => fetchAgendaCompleta(currentPage, 100),
    enabled: !!email,
  });

  const allEvents = useMemo<AgendaEvent[]>(() => {
    if (!agendaData || !Array.isArray(agendaData.eventos_fixos) || !Array.isArray(agendaData.revisoes_srs)) return [];
    const events: AgendaEvent[] = [];
    for (const ev of agendaData.eventos_fixos) {
      if (!ev.data_inicio) continue;
      events.push({
        data: String(ev.data_inicio).split("T")[0],
        tipo: ev.tipo === "aula" ? "aula" : "simulado",
        titulo: ev.titulo || "Evento",
        link_acesso: ev.link_acesso,
      });
    }
    for (const rev of agendaData.revisoes_srs) {
      if (!rev.data) continue;
      events.push({
        data: String(rev.data).split("T")[0],
        tipo: "flashcard",
        titulo: rev.aula_nome || "Revisão SRS",
        total_cards: Number(rev.qtd) || 0,
      });
    }
    return events;
  }, [agendaData]);

  // Próximos simulados para destaque
  const proximosSimulados = useMemo(() => {
    const today = toDateKey(new Date());
    return allEvents
      .filter((e) => e.tipo === "simulado" && e.data >= today)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 5);
  }, [allEvents]);

  const filtered = useMemo(() => {
    if (filter === "todos") return allEvents;
    return allEvents.filter((e) => e.tipo === filter);
  }, [allEvents, filter]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const item of filtered) {
      if (!map.has(item.data)) map.set(item.data, []);
      map.get(item.data)!.push(item);
    }
    return map;
  }, [filtered]);

  const selectedEvents = useMemo(() => eventsByDate.get(selectedDate) || [], [eventsByDate, selectedDate]);

  const handleFilterChange = useCallback((v: string) => {
    if (v) setFilter(v as FilterType);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-5xl mx-auto px-3 py-1.5">
          <ToggleGroup type="single" value={filter} onValueChange={handleFilterChange} className="justify-start gap-1">
            <ToggleGroupItem value="todos" size="sm" className="text-[11px] h-7 px-2">
              Todos
            </ToggleGroupItem>
            <ToggleGroupItem value="flashcard" size="sm" className="text-[11px] h-7 px-2">
              <Zap className="w-3 h-3 mr-0.5" /> Flashcards
            </ToggleGroupItem>
            <ToggleGroupItem value="aula" size="sm" className="text-[11px] h-7 px-2">
              <Play className="w-3 h-3 mr-0.5" /> Aulas
            </ToggleGroupItem>
            <ToggleGroupItem value="simulado" size="sm" className="text-[11px] h-7 px-2">
              <Target className="w-3 h-3 mr-0.5" /> Simulados
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-3 py-3 space-y-3">
          {/* Seção de destaques — próximos simulados */}
          {!isLoading && proximosSimulados.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Próximos Eventos em Destaque
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {proximosSimulados.map((simulado, i) => {
                  const dias = diasRestantes(simulado.data);
                  const urgente = dias <= 7;
                  return (
                    <motion.div
                      key={`${simulado.titulo}-${simulado.data}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedDate(simulado.data)}
                      className={`
                        shrink-0 w-48 rounded-xl border p-3 cursor-pointer transition-all
                        ${
                          urgente
                            ? "bg-destructive/5 border-destructive/30 hover:bg-destructive/10"
                            : "bg-card border-border hover:bg-muted"
                        }
                      `}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`p-1 rounded-md ${urgente ? "bg-destructive/10" : "bg-secondary/10"}`}>
                          <Target className={`w-3 h-3 ${urgente ? "text-destructive" : "text-secondary"}`} />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            urgente ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          {dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : `em ${dias}d`}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1">
                        {simulado.titulo}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatDataCurta(simulado.data)}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendário + Detalhe do dia */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Carregando agenda...</span>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="lg:w-1/3 lg:max-w-xs shrink-0">
                <AgendaCalendar
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  eventsByDate={eventsByDate}
                />
              </div>
              <div className="flex-1 min-w-0">
                <AgendaDayDetail selectedDate={selectedDate} eventos={selectedEvents} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Agenda;
