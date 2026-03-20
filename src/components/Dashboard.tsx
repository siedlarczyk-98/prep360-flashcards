import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCards, fetchCardsForToday, fetchNewCards, fetchProgressStats, FlashCard, syncWithAnki, fetchProgressoDisciplinas } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Loader2, ArrowLeft, Calendar, Sparkles, Brain, BarChart3, Trophy, Lightbulb, Info, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FlashCardItem from "./FlashCardItem";
import StudyMode from "./StudyMode";
import AnkiDialog from "./AnkiDialog";
import DisciplineCard from "./DisciplineCard";
import LessonCard from "./LessonCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardProps {
  email: string;
  onLogout: () => void;
}

export interface Discipline {
  name: string;
  cards: FlashCard[];
  lessons: {name: string;cards: FlashCard[];}[];
}

const Dashboard = ({ email, onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<FlashCard[]>([]);
  const [ankiDialog, setAnkiDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedAulaManual, setSelectedAulaManual] = useState<string>("todas");

  const { data: todayCards = [], isLoading: isLoadingToday } = useQuery<FlashCard[]>({
    queryKey: ["cards-today", email],
    queryFn: () => fetchCardsForToday()
  });

  const { data: newCards = [], isLoading: isLoadingNew } = useQuery<FlashCard[]>({
    queryKey: ["cards-new", email],
    queryFn: () => fetchNewCards()
  });

  const { data: allCards = [], isLoading: isLoadingAll } = useQuery<FlashCard[]>({
    queryKey: ["cards", email],
    queryFn: () => fetchCards()
  });

  const { data: progressStats } = useQuery({
    queryKey: ["progress-stats", email],
    queryFn: () => fetchProgressStats()
  });

  const { data: progressoDisciplinas = [] } = useQuery({
    queryKey: ["progresso-disciplinas", email],
    queryFn: () => fetchProgressoDisciplinas()
  });

  const isLoading = isLoadingToday || isLoadingNew || isLoadingAll;
  const displayCards = allCards;

  const disciplines = useMemo<Discipline[]>(() => {
    const map = new Map<string, FlashCard[]>();
    displayCards.forEach((card) => {
      const parts = card.tags ? card.tags.split("::") : [];
      const discipline = parts.length >= 2 ? parts[1].split(",")[0].trim() : parts[0]?.trim() || "Sem Disciplina";
      if (!map.has(discipline)) map.set(discipline, []);
      map.get(discipline)!.push(card);
    });
    return Array.from(map.entries()).map(([name, discCards]) => {
      const lessonMap = new Map<string, FlashCard[]>();
      discCards.forEach((card) => {
        const parts = card.tags ? card.tags.split("::") : [];
        const lesson = parts.length >= 3 ? parts[2].split(",")[0].trim() : "Geral";
        if (!lessonMap.has(lesson)) lessonMap.set(lesson, []);
        lessonMap.get(lesson)!.push(card);
      });
      const lessons = Array.from(lessonMap.entries()).map(([lName, lCards]) => ({ name: lName, cards: lCards }));
      return { name, cards: discCards, lessons };
    });
  }, [displayCards]);

  const activeDiscipline = disciplines.find((d) => d.name === selectedDiscipline);
  const activeLesson = activeDiscipline?.lessons.find((l) => l.name === selectedLesson);

  const handleStudy = (cardsToStudy: FlashCard[]) => {
    if (cardsToStudy.length === 0) {
      toast.info("Nenhum card disponível neste modo.");
      return;
    }
    setStudyCards(cardsToStudy);
    setStudyMode(true);
  };

  const handleAnkiSync = async () => {
    const aulaParam = selectedAulaManual === "todas" ? undefined : selectedAulaManual;
    setSyncing(true);
    try {
      const { fetchEstudoManual } = await import("@/lib/api");
      const cards = await fetchEstudoManual(aulaParam);
      if (cards.length === 0) {
        toast.info("Nenhum card encontrado para sincronizar.");
        return;
      }
      const result = await syncWithAnki(cards);
      toast.success(`✅ ${result.count} cards sincronizados!`, { description: "Cards exportados para o deck 'Paciente360' no Anki!", duration: 5000 });
    } catch (err: any) {
      if (err.message === "ANKI_NOT_CONNECTED") {
        setAnkiDialog(true);
      } else {
        toast.error("Falha na sincronização", { description: "Verifique se o Anki está aberto com o plugin AnkiConnect ativo.", duration: 6000 });
      }
    } finally {
      setSyncing(false);
    }
  };

  const aulasUnicas = useMemo(() => {
    const map = new Map<string, string>();
    allCards.forEach((card) => {
      map.set(card.aula_id, card.tags?.split("::").pop()?.split(",")[0]?.trim() || `Aula ${card.aula_id}`);
    });
    return Array.from(map.entries());
  }, [allCards]);

  const getProgressForDiscipline = (discCards: FlashCard[]) => {
    if (progressoDisciplinas.length === 0) return 0;
    const cardIds = new Set(discCards.map((c) => c.id));
    const matching = progressoDisciplinas.filter((p) => cardIds.has(Number(p.aula_id)));
    if (matching.length > 0) {
      const avg = matching.reduce((sum, p) => sum + p.progresso_percentual, 0) / matching.length;
      return Math.round(avg);
    }
    const total = progressoDisciplinas.reduce((sum, p) => sum + p.progresso_percentual, 0);
    return Math.round(total / progressoDisciplinas.length);
  };

  const todayHasCards = todayCards.length > 0;
  const newHasCards = newCards.length > 0;

  return (
    <>
      <AnimatePresence>
        {studyMode && studyCards.length > 0 &&
        <StudyMode cards={studyCards} email={email} onClose={() => {
          setStudyMode(false);
          queryClient.invalidateQueries({ queryKey: ["cards-today", email] });
          queryClient.invalidateQueries({ queryKey: ["cards-new", email] });
          queryClient.invalidateQueries({ queryKey: ["progress-stats", email] });
          queryClient.invalidateQueries({ queryKey: ["progresso-disciplinas", email] });
          queryClient.invalidateQueries({ queryKey: ["cards", email] });
        }} />
        }
      </AnimatePresence>

      <AnkiDialog open={ankiDialog} onOpenChange={setAnkiDialog} />

      <div className="h-full flex flex-col bg-background bg-circles-pattern">

        <main className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full px-3 py-3 space-y-3 relative z-[1]">
          {isLoading ?
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div> :
          !selectedDiscipline ?
          <>
              {/* Main action panels */}
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => todayHasCards && handleStudy(todayCards)}
                disabled={!todayHasCards}
                className={`rounded-xl bg-primary p-4 text-left transition-all ${
                todayHasCards ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer" : "opacity-60 cursor-not-allowed"}`
                }
                style={{ boxShadow: "var(--shadow-elevated)" }}>
                  <Calendar className="w-4 h-4 text-accent mb-1.5" />
                  <p className="text-2xl font-bold text-primary-foreground">{todayCards.length}</p>
                  <p className="text-[10px] text-primary-foreground/60 mt-0.5">Cards para Hoje</p>
                  {!todayHasCards &&
                <p className="text-[9px] text-primary-foreground/40 mt-0.5">Revisões concluídas! 🎉</p>
                }
                </motion.button>

                <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                onClick={() => newHasCards && handleStudy(newCards)}
                disabled={!newHasCards}
                className={`rounded-xl bg-card border border-border p-4 text-left transition-all ${
                newHasCards ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer" : "opacity-60 cursor-not-allowed"}`
                }
                style={{ boxShadow: "var(--shadow-elevated)" }}>
                  <Sparkles className="w-4 h-4 text-accent mb-1.5" />
                  <p className="text-2xl font-bold text-foreground">{newCards.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Novos Disponíveis</p>
                  {!newHasCards &&
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">Nenhum card novo</p>
                }
                </motion.button>
              </div>

              {!todayHasCards && !newHasCards &&
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 rounded-xl bg-gradient-to-br from-[hsl(var(--success)/0.08)] to-[hsl(var(--warning)/0.06)] border border-[hsl(var(--success)/0.2)]">
                  <Trophy className="w-10 h-10 text-accent mx-auto mb-2" />
                  <p className="text-base font-bold text-foreground">Missão do dia cumprida!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Volte amanhã para manter o ritmo!</p>
                </motion.div>
            }

              {/* Performance Section */}
              {progressStats &&
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seu Desempenho</h3>
                  <div className="grid grid-cols-3 gap-2 auto-rows-fr">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-xl bg-card border border-border p-2.5 text-center cursor-help relative group" style={{ boxShadow: "var(--shadow-card)" }}>
                          <Info className="w-2.5 h-2.5 text-muted-foreground/40 absolute top-1 right-1 group-hover:text-accent transition-colors" />
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--warning)/0.1)] flex items-center justify-center mx-auto mb-1">
                            <Brain className="w-4 h-4 text-[hsl(var(--warning))]" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{progressStats.aprendendo}</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Aprendendo</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] text-center">
                        <p className="text-[11px]">Cards novos ou errados recentemente.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-xl bg-card border border-border p-2.5 text-center cursor-help relative group" style={{ boxShadow: "var(--shadow-card)" }}>
                          <Info className="w-2.5 h-2.5 text-muted-foreground/40 absolute top-1 right-1 group-hover:text-accent transition-colors" />
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-1">
                            <BarChart3 className="w-4 h-4 text-secondary" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{progressStats.revisando}</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Revisando</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] text-center">
                        <p className="text-[11px]">Cards em intervalos crescentes para retenção.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-xl bg-card border border-border p-2.5 text-center cursor-help relative group" style={{ boxShadow: "var(--shadow-card)" }}>
                          <Info className="w-2.5 h-2.5 text-muted-foreground/40 absolute top-1 right-1 group-hover:text-accent transition-colors" />
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--success)/0.1)] flex items-center justify-center mx-auto mb-1">
                            <Trophy className="w-4 h-4 text-[hsl(var(--success))]" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{progressStats.memorizados}</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Memorizados</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] text-center">
                        <p className="text-[11px]">Cards que você domina.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </motion.div>
            }

              {/* Estudo Manual */}
              <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Estudo Manual
                </h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedAulaManual} onValueChange={(v) => setSelectedAulaManual(v)}>
                    <SelectTrigger className="flex-1 h-8 rounded-lg bg-card border-border text-xs">
                      <SelectValue placeholder="Filtrar por Aula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Aulas</SelectItem>
                      {aulasUnicas.map(([id, nome]) => (
                        <SelectItem key={id} value={id}>{nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      const aulaParam = selectedAulaManual === "todas" ? undefined : selectedAulaManual;
                      navigate("/dashboard/estudo-manual", { state: { aulaId: aulaParam } });
                    }}
                    className="h-8 px-4 text-xs font-semibold gap-1.5 bg-accent text-accent-foreground hover:bg-accent/85 rounded-lg shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Iniciar Revisão
                  </Button>
                </div>
              </motion.div>

              {/* Disciplines grid */}
              {displayCards.length > 0 &&
            <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disciplinas</h3>
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    {disciplines.map((disc, i) =>
                <DisciplineCard
                  key={disc.name}
                  name={disc.name}
                  totalCards={disc.cards.length}
                  studiedCards={Math.round(disc.cards.length * getProgressForDiscipline(disc.cards) / 100)}
                  onClick={() => setSelectedDiscipline(disc.name)}
                  index={i} />
                )}
                  </div>
                </div>
            }

              {/* Footer with Anki */}
              <div className="pt-3 border-t border-border text-center">
              <button
                onClick={() => handleAnkiSync()}
                disabled={syncing}
                className="text-[11px] text-muted-foreground hover:text-accent transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 mx-auto">
                  {syncing ? <><Loader2 className="w-3 h-3 animate-spin" /> Sincronizando...</> : "Sincronizar com Anki →"}
                </button>
              </div>
            </> :
          activeDiscipline && !selectedLesson ?
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <button onClick={() => setSelectedDiscipline(null)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar às disciplinas
              </button>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">{activeDiscipline.name}</h3>
                <span className="text-xs text-muted-foreground">{activeDiscipline.cards.length} card{activeDiscipline.cards.length !== 1 ? "s" : ""}</span>
              </div>
              <Button onClick={() => handleStudy(activeDiscipline.cards)} className="w-full h-10 text-xs font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/85 rounded-lg">
                <Play className="w-3.5 h-3.5" />
                Estudar Toda Disciplina
              </Button>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aulas</h4>
                <div className="grid gap-1.5">
                  {activeDiscipline.lessons.map((lesson, i) =>
                <LessonCard key={lesson.name} name={lesson.name} totalCards={lesson.cards.length} onClick={() => setSelectedLesson(lesson.name)} index={i} />
                )}
                </div>
              </div>
            </motion.div> :
          selectedLesson && activeLesson ?
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar às aulas
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">{activeDiscipline?.name}</p>
                  <h3 className="text-base font-bold text-foreground">{activeLesson.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{activeLesson.cards.length} card{activeLesson.cards.length !== 1 ? "s" : ""}</span>
              </div>
              <Button onClick={() => handleStudy(activeLesson.cards)} className="w-full h-10 text-xs font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/85 rounded-lg">
                <Play className="w-3.5 h-3.5" />
                Estudar Aula
              </Button>
              <div className="grid gap-3">
                {activeLesson.cards.map((card, i) =>
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                    <FlashCardItem card={card} />
                  </motion.div>
              )}
              </div>
            </motion.div> :
          null}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
