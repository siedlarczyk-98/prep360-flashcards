import { useEffect, useState, useMemo, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Zap, ClipboardList, BookOpen, RefreshCw,
  CheckCircle2, Loader2, AlertCircle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  fetchResumoSemanal, fetchProgressStats, fetchAtividadeDiaria,
  fetchDesempenhoQuestoes, fetchDesempenhoComparativo,
  type ResumoSemanal, type ProgressStats, type AtividadeDiaria,
  type DesempenhoArea, type ResultadoComparativo,
} from "@/lib/api";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const srsTooltips: Record<string, string> = {
  aprendendo: "Cards que você viu pela primeira vez recentemente. Eles aparecerão com mais frequência até serem absorvidos.",
  revisando: "Cards que você já conhece, mas ainda precisam de reforço periódico para fixar na memória de longo prazo.",
  memorizados: "Cards que você domina! A revisão deles é rara porque já estão consolidados.",
};

function fillLast7Days(data: AtividadeDiaria[]): (AtividadeDiaria & { label: string })[] {
  const map = new Map(data.map((d) => [d.data, d]));
  const days: (AtividadeDiaria & { label: string })[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const key = format(date, "yyyy-MM-dd");
    const entry = map.get(key) || { data: key, flashcards: 0, questoes: 0, aulas: 0 };
    days.push({ ...entry, label: format(date, "EEE", { locale: ptBR }).replace(".", "") });
  }
  return days;
}

function barColor(pct: number) {
  if (pct >= 70) return "bg-[hsl(152,60%,45%)]";
  if (pct >= 40) return "bg-[hsl(25,90%,50%)]";
  return "bg-destructive";
}

const MetricasPage = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoSemanal>({ flashcards: 0, questoes: 0 });
  const [srs, setSrs] = useState<ProgressStats>({ aprendendo: 0, revisando: 0, memorizados: 0 });
  const [atividade, setAtividade] = useState<AtividadeDiaria[]>([]);
  const [desempenho, setDesempenho] = useState<DesempenhoArea[]>([]);
  const [comparativo, setComparativo] = useState<ResultadoComparativo | null>(null);
  const [tentativa, setTentativa] = useState<"primeira" | "ultima">("primeira");
  const [loadingDesempenho, setLoadingDesempenho] = useState(false);

  useEffect(() => {
    if (!email) { navigate("/", { replace: true }); return; }
    setLoading(true);
    Promise.all([
      fetchResumoSemanal(),
      fetchProgressStats(),
      fetchAtividadeDiaria(),
      fetchDesempenhoQuestoes(tentativa),
      fetchDesempenhoComparativo(tentativa),
    ])
      .then(([r, s, a, d, c]) => {
        setResumo(r);
        setSrs(s);
        setAtividade(a);
        setDesempenho(d);
        if (c) setComparativo(c);
      })
      .catch((err) => {
        setError("Não foi possível carregar as métricas.");
        toast.error("Erro ao carregar métricas", { description: String(err?.message || err) });
      })
      .finally(() => setLoading(false));
  }, [email, navigate]);

  useEffect(() => {
    if (loading || !email) return;
    setLoadingDesempenho(true);
    Promise.all([
      fetchDesempenhoQuestoes(tentativa),
      fetchDesempenhoComparativo(tentativa),
    ])
      .then(([d, c]) => {
        setDesempenho(d);
        if (c) setComparativo(c);
      })
      .catch(() => {
        setDesempenho([]);
        toast.error("Erro ao carregar desempenho por área");
      })
      .finally(() => setLoadingDesempenho(false));
  }, [tentativa]);

  const days = useMemo(() => fillLast7Days(atividade), [atividade]);
  const maxVolume = useMemo(() => Math.max(...days.map((d) => d.flashcards + d.questoes + d.aulas), 1), [days]);

  if (!email) return null;

  const ease = [0.16, 1, 0.3, 1] as const;
  const stagger = {
    hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
    show: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: i * 0.08, duration: 0.5, ease } }),
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
        className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3"
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Métricas</h1>
            <p className="text-xs text-muted-foreground">Seu desempenho geral</p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-24">
        {error && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Seção 1: Resumo 7 dias */}
        <section>
          <motion.h2 variants={stagger} custom={0} initial="hidden" animate="show" className="text-sm font-semibold text-foreground mb-2">
            Últimos 7 dias
          </motion.h2>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              <><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></>
            ) : (
              <>
                <motion.div variants={stagger} custom={1} initial="hidden" animate="show" className="bg-card rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[hsl(var(--brand-blue))] flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Flashcards</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{resumo.flashcards}</p>
                </motion.div>
                <motion.div variants={stagger} custom={2} initial="hidden" animate="show" className="bg-card rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[hsl(var(--brand-orange))] flex items-center justify-center">
                      <ClipboardList className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Questões</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{resumo.questoes}</p>
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Seção 2: SRS */}
        <section>
          <motion.h2 variants={stagger} custom={3} initial="hidden" animate="show" className="text-sm font-semibold text-foreground mb-2">
            Memorização (SRS)
          </motion.h2>
          <div className="grid grid-cols-3 gap-3">
            {loading ? (
              <><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></>
            ) : (
              [
                { key: "aprendendo" as const, label: "Aprendendo", value: srs.aprendendo, Icon: BookOpen, accent: "hsl(var(--brand-orange))" },
                { key: "revisando" as const, label: "Revisando", value: srs.revisando, Icon: RefreshCw, accent: "hsl(var(--brand-blue))" },
                { key: "memorizados" as const, label: "Memorizados", value: srs.memorizados, Icon: CheckCircle2, accent: "hsl(var(--success))" },
              ].map((item, i) => (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    <motion.div variants={stagger} custom={4 + i} initial="hidden" animate="show" className="bg-card rounded-xl p-4 shadow-sm cursor-default">
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.Icon className="w-3.5 h-3.5" style={{ color: item.accent }} />
                        <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{item.value}</p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">{srsTooltips[item.key]}</TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
        </section>

        {/* Seção 3: Atividade Diária */}
        <section>
          <motion.h2 variants={stagger} custom={7} initial="hidden" animate="show" className="text-sm font-semibold text-foreground mb-2">
            Atividade Diária
          </motion.h2>
          {loading ? <Skeleton className="h-44 rounded-xl" /> : (
            <motion.div variants={stagger} custom={8} initial="hidden" animate="show" className="bg-card rounded-xl p-4 shadow-sm">
              <div className="flex items-end gap-2 h-32">
                {days.map((day) => {
                  const total = day.flashcards + day.questoes + day.aulas;
                  const pct = (total / maxVolume) * 100;
                  return (
                    <Tooltip key={day.data}>
                      <TooltipTrigger asChild>
                        <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-default">
                          <div className="w-full rounded-md bg-[hsl(var(--brand-blue))] transition-all duration-300 min-h-[4px]" style={{ height: `${Math.max(pct, 3)}%` }} />
                          <span className="text-[10px] text-muted-foreground capitalize">{day.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs space-y-0.5">
                        <p className="font-semibold">{format(parseISO(day.data), "dd/MM")}</p>
                        <p>Flashcards: {day.flashcards}</p>
                        <p>Questões: {day.questoes}</p>
                        <p>Aulas: {day.aulas}</p>
                        <p className="font-medium pt-0.5 border-t border-border">Total: {total}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </motion.div>
          )}
        </section>

        {/* Seção 4: Desempenho por Área */}
        <section>
          <motion.div variants={stagger} custom={9} initial="hidden" animate="show" className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Desempenho por Área</h2>
              {comparativo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    {comparativo.grupo === 'interesse'
                      ? 'A barra cinza mostra a média de alunos com interesses semelhantes aos seus.'
                      : 'A barra cinza mostra a média de todos os alunos da plataforma. Defina seus interesses no perfil para uma comparação mais precisa.'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex bg-muted rounded-lg p-0.5">
              {(["primeira", "ultima"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTentativa(t)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors duration-150 ${
                    tentativa === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "primeira" ? "1ª tentativa" : "Última"}
                </button>
              ))}
            </div>
          </motion.div>

          {loading || loadingDesempenho ? (