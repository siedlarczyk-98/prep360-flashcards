import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCardsForToday,
  fetchNewCards,
  fetchProgressStats,
  fetchProgressoDisciplinas,
  fetchEstudoManual,
  FlashCard,
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  ArrowLeft,
  Calendar,
  Sparkles,
  Brain,
  BarChart3,
  Trophy,
  Info,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FlashCardItem from "./FlashCardItem";
import StudyMode from "./StudyMode";
import DisciplineCard from "./DisciplineCard";
import LessonCard from "./LessonCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardProps {
  email: string;
  onLogout: () => void;
}

export interface Discipline {
  name: string;
  cards: FlashCard[];
  lessons: { name: string; cards: FlashCard[] }[];
}

const Dashboard = ({ email, onLogout }: DashboardProps) => {
  const queryClient = useQueryClient();
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<FlashCard[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedCourseManual, setSelectedCourseManual] = useState("todas");

  const { data: todayCards = [], isLoading: isLoadingToday } = useQuery({
    queryKey: ["cards-today"],
    queryFn: () => fetchCardsForToday(),
  });

  const { data: newCards = [], isLoading: isLoadingNew } = useQuery({
    queryKey: ["cards-new"],
    queryFn: () => fetchNewCards(),
  });

  const { data: progressStats } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => fetchProgressStats(),
  });

  const { data: progressoDisciplinas = [] } = useQuery({
    queryKey: ["progresso-disciplinas"],
    queryFn: () => fetchProgressoDisciplinas(),
  });

  const allCards = useMemo(() => [...todayCards, ...newCards], [todayCards, newCards]);
  const isLoading = isLoadingToday || isLoadingNew;

  const disciplines = useMemo(() => {
    const map = new Map<string, FlashCard[]>();
    allCards.forEach((card) => {
      const parts = card.tag_cont ? card.tag_cont.split("::") : [];
      const discipline =
        parts.length >= 2 ? parts[1].split(",")[0].trim() : parts[0]?.trim() || "Sem Disciplina";
      if (!map.has(discipline)) map.set(discipline, []);
      map.get(discipline)!.push(card);
    });
    return Array.from(map.entries()).map(([name, discCards]) => {
      const lessonMap = new Map<string, FlashCard[]>();
      discCards.forEach((card) => {
        const parts = card.tag_cont ? card.tag_cont.split("::") : [];
        const lesson = parts.length >= 3 ? parts[2].split(",")[0].trim() : "Geral";
        if (!lessonMap.has(lesson)) lessonMap.set(lesson, []);
        lessonMap.get(lesson)!.push(card);
      });
      const lessons = Array.from(lessonMap.entries()).map(([lName, lCards]) => ({
        name: lName,
        cards: lCards,
      }));
      return { name, cards: discCards, lessons };
    });
  }, [allCards]);

  const activeDiscipline = disciplines.find((d) => d.name === selectedDiscipline);
  const activeLesson = activeDiscipline?.lessons.find((l) => l.name === selectedLesson);

  const cursosUnicos = useMemo(() => {
    const map = new Map<number, string>();
    allCards.forEach((card) => {
      if (card.course_id && card.course_name) map.set(card.course_id, card.course_name);
    });
    return Array.from(map.entries());
  }, [allCards]);

  const handleStudy = (cardsToStudy: FlashCard[]) => {
    if (cardsToStudy.length === 0) {
      toast.info("Nenhum card disponível neste modo.");
      return;
    }
    setStudyCards(cardsToStudy);
    setStudyMode(true);
  };

  const handleEstudoManual = async () => {
    const courseParam = selectedCourseManual === "todas" ? undefined : selectedCourseManual;
    try {
      const cards = await fetchEstudoManual(courseParam);
      if (cards.length === 0) {
        toast.info("Nenhum card encontrado.");
        return;
      }
      setStudyCards(cards);
      setStudyMode(true);
    } catch {
      toast.error("Erro ao buscar cards.");
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["cards-today"] });
    queryClient.invalidateQueries({ queryKey: ["cards-new"] });
    queryClient.invalidateQueries({ queryKey: ["progress-stats"] });
    queryClient.invalidateQueries({ queryKey: ["progresso-disciplinas"] });
  };

  const getProgressForDiscipline = (discCards: FlashCard[]) => {
    if (progressoDisciplinas.length === 0) return 0;
    const courseIds = new Set(discCards.map((c) => c.course_id));
    const matching = progressoDisciplinas.filter((p) => courseIds.has(p.course_id));
    if (matching.length === 0) return 0;
    const total = matching.reduce((sum, p) => sum + p.cards_estudados, 0);
    const totalCards = matching.reduce((sum, p) => sum + p.total_cards, 0);
    return totalCards > 0 ? Math.round((total / totalCards) * 100) : 0;
  };

  const todayHasCards = todayCards.length > 0;
  const newHasCards = newCards.length > 0;

  return (
    <>
      <AnimatePresence>
        {studyMode && studyCards.length > 0 && (
          <StudyMode
            cards={studyCards}
            email={email}
            onClose={() => {
              setStudyMode(false);
              invalidateAll();
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-accent mr-2" />
              <span className="text-muted-foreground text-sm">Carregando...</span>
            </div>
          ) : !selectedDiscipline ? (
            <>
              {/* Study cards */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => todayHasCards && handleStudy(todayCards)}
                  disabled={!todayHasCards}
                  className={`rounded-xl bg-primary p-4 text-left transition-all ${
                    todayHasCards
                      ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  style={{ boxShadow: "var(--shadow-elevated)" }}
                >
                  <Calendar className="w-5 h-5 text-accent mb-2" />
                  <p className="text-2xl font-bold text-primary-foreground">{todayCards.length}</p>
                  <p className="text-primary-foreground/70 text-xs">Cards para Hoje</p>
                  {!todayHasCards && (
                    <p className="text-primary-foreground/40 text-[10px] mt-1">Revisões concluídas! 🎉</p>
                  )}
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  onClick={() => newHasCards && handleStudy(newCards)}
                  disabled={!newHasCards}
                  className={`rounded-xl bg-card border border-border p-4 text-left transition-all ${
                    newHasCards
                      ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  style={{ boxShadow: "var(--shadow-elevated)" }}
                >
                  <Sparkles className="w-5 h-5 text-accent mb-2" />
                  <p className="text-2xl font-bold text-foreground">{newCards.length}</p>
                  <p className="text-muted-foreground text-xs">Novos Disponíveis</p>
                  {!newHasCards && (
                    <p className="text-muted-foreground/60 text-[10px] mt-1">Nenhum card novo</p>
                  )}
                </motion.button>
              </div>

              {/* All done message */}
              {!todayHasCards && !newHasCards && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-card border border-border p-6 text-center"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="text-foreground font-semibold text-sm">Missão do dia cumprida!</p>
                  <p className="text-muted-foreground text-xs mt-1">Volte amanhã para manter o ritmo!</p>
                </motion.div>
              )}

              {/* Progress stats */}
              {progressStats && (
                <div
                  className="rounded-xl bg-card border border-border p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-foreground font-semibold text-sm mb-3">Seu Desempenho</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-3 text-center cursor-help">
                          <Brain className="w-4 h-4 text-[hsl(var(--warning))] mx-auto mb-1" />
                          <p className="text-foreground font-bold text-lg">{progressStats.aprendendo}</p>
                          <p className="text-muted-foreground text-[10px]">Aprendendo</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Cards novos ou errados recentemente.</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-lg bg-secondary/30 p-3 text-center cursor-help">
                          <BarChart3 className="w-4 h-4 text-secondary mx-auto mb-1" />
                          <p className="text-foreground font-bold text-lg">{progressStats.revisando}</p>
                          <p className="text-muted-foreground text-[10px]">Revisando</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Cards em intervalos crescentes para retenção.</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-lg bg-[hsl(var(--success))]/10 p-3 text-center cursor-help">
                          <Trophy className="w-4 h-4 text-[hsl(var(--success))] mx-auto mb-1" />
                          <p className="text-foreground font-bold text-lg">{progressStats.memorizados}</p>
                          <p className="text-muted-foreground text-[10px]">Memorizados</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Cards que você domina.</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}



              {/* Disciplines */}
              {allCards.length > 0 && (
                <div>
                  <p className="text-foreground font-semibold text-sm mb-3">Disciplinas</p>
                  <div className="space-y-2">
                    {disciplines.map((disc, i) => (
                      <DisciplineCard
                        key={disc.name}
                        name={disc.name}
                        totalCards={disc.cards.length}
                        studiedCards={getProgressForDiscipline(disc.cards)}
                        onClick={() => setSelectedDiscipline(disc.name)}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : activeDiscipline && !selectedLesson ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedDiscipline(null)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar às disciplinas
              </button>
              <div>
                <h2 className="text-foreground font-bold text-lg">{activeDiscipline.name}</h2>
                <p className="text-muted-foreground text-xs">
                  {activeDiscipline.cards.length} card{activeDiscipline.cards.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={() => handleStudy(activeDiscipline.cards)}
                className="w-full h-10 text-xs font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/85 rounded-lg"
              >
                <Play className="w-3.5 h-3.5" />
                Estudar Toda Disciplina
              </Button>
              <div>
                <p className="text-foreground font-semibold text-sm mb-2">Aulas</p>
                <div className="space-y-2">
                  {activeDiscipline.lessons.map((lesson, i) => (
                    <LessonCard
                      key={lesson.name}
                      name={lesson.name}
                      totalCards={lesson.cards.length}
                      onClick={() => setSelectedLesson(lesson.name)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : selectedLesson && activeLesson ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedLesson(null)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar às aulas
              </button>
              <div>
                <div>
                  <p className="text-muted-foreground text-xs">{activeDiscipline?.name}</p>
                  <h2 className="text-foreground font-bold text-lg">{activeLesson.name}</h2>
                </div>
                <p className="text-muted-foreground text-xs mt-1">
                  {activeLesson.cards.length} card{activeLesson.cards.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={() => handleStudy(activeLesson.cards)}
                className="w-full h-10 text-xs font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/85 rounded-lg"
              >
                <Play className="w-3.5 h-3.5" />
                Estudar Aula
              </Button>
              <div className="space-y-3">
                {activeLesson.cards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <FlashCardItem card={card} />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
