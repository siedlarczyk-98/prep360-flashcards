import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgendaCompleta } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Calendar, Zap, Play, Target } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AgendaCalendar from "@/components/AgendaCalendar";
import AgendaDayDetail from "@/components/AgendaDayDetail";

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

const Agenda = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("todos");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [currentPage, setCurrentPage] = useState(1);

  const email = localStorage.getItem("userEmail") || "";

  const { data: agendaData, isLoading } = useQuery({
    queryKey: ["agenda-completa", email, currentPage],
    queryFn: () => fetchAgendaCompleta(email, currentPage, 100),
    enabled: !!email,
  });

  const allEvents = useMemo<AgendaEvent[]>(() => {
    if (!agendaData || !Array.isArray(agendaData.eventos_fixos) || !Array.isArray(agendaData.revisoes_srs)) return [];
    const events: AgendaEvent[] = [];
    for (const ev of agendaData.eventos_fixos) {
      if (!ev.data_inicio) continue;
      events.push({ data: String(ev.data_inicio).split("T")[0], tipo: ev.tipo === "aula" ? "aula" : "simulado", titulo: ev.titulo || "Evento", link_acesso: ev.link_acesso });
    }
    for (const rev of agendaData.revisoes_srs) {
      if (!rev.data) continue;
      events.push({ data: String(rev.data).split("T")[0], tipo: "flashcard", titulo: rev.aula_nome || "Revisão SRS", total_cards: Number(rev.qtd) || 0 });
    }
    return events;
  }, [agendaData]);

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
            <ToggleGroupItem value="todos" size="sm" className="text-[11px] h-7 px-2">Todos</ToggleGroupItem>
            <ToggleGroupItem value="flashcard" size="sm" className="text-[11px] h-7 px-2"><Zap className="w-3 h-3 mr-0.5" /> Flashcards</ToggleGroupItem>
            <ToggleGroupItem value="aula" size="sm" className="text-[11px] h-7 px-2"><Play className="w-3 h-3 mr-0.5" /> Aulas</ToggleGroupItem>
            <ToggleGroupItem value="simulado" size="sm" className="text-[11px] h-7 px-2"><Target className="w-3 h-3 mr-0.5" /> Simulados</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-3 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Carregando agenda...</span>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="lg:w-[320px] shrink-0">
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
