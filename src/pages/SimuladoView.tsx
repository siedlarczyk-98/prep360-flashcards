import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Bookmark, CheckCircle2, Clock3, Loader2,
  ListChecks, MessageSquareText, PanelRightClose, PanelRightOpen, ThumbsDown, ThumbsUp, XCircle,
} from "lucide-react";
import { useEmbedNavigate } from "@/hooks/useEmbedNavigate";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  corrigirSimulado, enviarFeedbackProf, fetchQuestoes, responderQuestao,
  fetchTentativaSimulado, finalizarSimuladoOficial, salvarRespostaSimulado,
  type Questao, type ResultadoResposta,
} from "@/lib/api";
import SimuladoCompletion, { type RespostaHistorico } from "@/components/SimuladoCompletion";
import { SimuladoQuestionMap } from "@/components/SimuladoQuestionMap";
import { parseAlternative } from "@/lib/questionContent";
import logoIsotipo from "@/assets/logo-isotipo.png";

type Respostas = Record<string, string>;
type PersistedSession = {
  indice: number;
  respostas: Respostas;
  marcadas: number[];
  iniciadoEm: string;
};

const formatTime = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hours, minutes, secs].map((n) => String(n).padStart(2, "0")).join(":");
};

const FeedbackProfCard = ({ resultado, questaoId }: { resultado: ResultadoResposta; questaoId: number }) => {
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const send = async (util: boolean) => {
    setSending(true);
    try { await enviarFeedbackProf(questaoId, util); setFeedback(util); }
    finally { setSending(false); }
  };
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3 mb-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <MessageSquareText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold">Comentário do Professor</span>
        <span className={`ml-auto text-[9px] font-semibold ${resultado.acertou ? "text-green-700" : "text-red-700"}`}>
          {resultado.acertou ? "✓ Correto" : "✕ Incorreto"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground whitespace-pre-line">{resultado.feedback_prof}</p>
      <div className="border-t border-border mt-3 pt-2 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Esse comentário foi útil?</span>
        <div className="flex ml-auto">
          <Button variant="ghost" size="sm" disabled={sending || feedback === true} onClick={() => send(true)}><ThumbsUp className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" disabled={sending || feedback === false} onClick={() => send(false)}><ThumbsDown className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </div>
  );
};

const SimuladoView = () => {
  const navigate = useEmbedNavigate();
  const [searchParams] = useSearchParams();
  const email = localStorage.getItem("userEmail") || "";
  const modo = searchParams.get("modo") || undefined;
  const aulaId = searchParams.get("aula_id") || undefined;
  const grandeArea = searchParams.get("grande_area") || undefined;
  const instituicao = searchParams.get("instituicao") || undefined;
  const limite = searchParams.get("limite") ? Number(searchParams.get("limite")) : 20;
  const duracaoMin = searchParams.get("tempo") ? Number(searchParams.get("tempo")) : 0;
  const seed = searchParams.get("seed") ? Number(searchParams.get("seed")) : undefined;
  const tentativaId = searchParams.get("tentativa_id") ? Number(searchParams.get("tentativa_id")) : null;
  const isOfficial = Number.isInteger(tentativaId) && Number(tentativaId) > 0;
  const isExam = modo === "simulado" || isOfficial;
  const storageKey = `prep360:simulado:${email}:${searchParams.toString()}`;

  const restored = useMemo<PersistedSession | null>(() => {
    if (!isExam) return null;
    try { return JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { return null; }
  }, [isExam, storageKey]);

  const [indiceAtual, setIndiceAtual] = useState(restored?.indice ?? 0);
  const [respostas, setRespostas] = useState<Respostas>(restored?.respostas ?? {});
  const [marcadas, setMarcadas] = useState<number[]>(restored?.marcadas ?? []);
  const [iniciadoEm] = useState(restored?.iniciadoEm ?? new Date().toISOString());
  const [resultadoAtual, setResultadoAtual] = useState<ResultadoResposta | null>(null);
  const [historico, setHistorico] = useState<RespostaHistorico[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const legacyQuery = useQuery({
    queryKey: ["questoes-simulado", email, modo, aulaId, grandeArea, instituicao, limite, seed],
    queryFn: () => fetchQuestoes({ apenas_liberadas: true, modo, aula_id: aulaId, grande_area: grandeArea, instituicao, limite, seed }),
    enabled: !!email && !isOfficial,
    staleTime: isExam ? Infinity : 0,
  });

  const officialQuery = useQuery({
    queryKey: ["tentativa-simulado", email, tentativaId],
    queryFn: () => fetchTentativaSimulado(Number(tentativaId)),
    enabled: !!email && isOfficial,
    staleTime: Infinity,
  });

  const officialAttempt = officialQuery.data;
  const officialQuestions = officialAttempt?.questoes;
  const questoes = isOfficial ? officialQuestions : legacyQuery.data;
  const isLoading = isOfficial ? officialQuery.isLoading : legacyQuery.isLoading;
  const isError = isOfficial ? officialQuery.isError : legacyQuery.isError;
  const serverOffsetMs = useMemo(
    () => officialAttempt?.agora_servidor ? new Date(officialAttempt.agora_servidor).getTime() - Date.now() : 0,
    [officialAttempt?.agora_servidor],
  );
  const effectiveNow = clockNow + serverOffsetMs;
  const inicioEfetivo = officialAttempt?.iniciado_em || iniciadoEm;
  const elapsed = Math.max(0, Math.floor((effectiveNow - new Date(inicioEfetivo).getTime()) / 1000));

  const total = questoes?.length ?? 0;
  const atual = questoes?.[indiceAtual];
  const escolha = atual ? respostas[String(atual.id)] || null : null;
  const respondidas = Object.keys(respostas).length;
  const restantes = Math.max(0, total - respondidas);
  const mensagemEmBranco = restantes === 0
    ? "Todas as questões foram respondidas."
    : restantes === 1
      ? "1 questão será entregue em branco."
      : `${restantes} questões serão entregues em branco.`;
  const officialRemaining = officialAttempt?.expira_em
    ? Math.floor((new Date(officialAttempt.expira_em).getTime() - effectiveNow) / 1000)
    : 0;
  const hasTimeLimit = isOfficial ? Boolean(officialAttempt?.expira_em) : duracaoMin > 0;
  const remainingSeconds = isOfficial ? officialRemaining : duracaoMin > 0 ? duracaoMin * 60 - elapsed : 0;

  useEffect(() => { if (!email) navigate("/", { replace: true }); }, [email, navigate]);
  useEffect(() => {
    if (!isExam || showCompletion) return;
    localStorage.setItem(storageKey, JSON.stringify({ indice: indiceAtual, respostas, marcadas, iniciadoEm }));
  }, [indiceAtual, respostas, marcadas, iniciadoEm, isExam, showCompletion, storageKey]);
  useEffect(() => {
    if (!isExam || showCompletion) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isExam, showCompletion]);

  useEffect(() => {
    if (!isOfficial || !officialQuestions) return;
    setRespostas(Object.fromEntries(officialQuestions.filter((q) => q.escolha).map((q) => [String(q.id), q.escolha as string])));
    setMarcadas(officialQuestions.filter((q) => q.marcada_revisao).map((q) => q.id));
  }, [isOfficial, officialQuestions]);

  const selectAnswer = (letter: string) => {
    if (!atual || (!isExam && resultadoAtual)) return;
    setRespostas((current) => ({ ...current, [String(atual.id)]: letter }));
    if (isOfficial && tentativaId) {
      saveQueue.current = saveQueue.current
        .then(() => salvarRespostaSimulado(tentativaId, atual.id, letter))
        .catch(() => { toast.error("Não foi possível salvar esta resposta.", { description: "Verifique sua conexão e tente novamente." }); });
    }
  };

  const toggleMarked = () => {
    if (!atual) return;
    const marcada = !marcadas.includes(atual.id);
    setMarcadas((ids) => marcada ? [...ids, atual.id] : ids.filter((id) => id !== atual.id));
    if (isOfficial && tentativaId) {
      saveQueue.current = saveQueue.current
        .then(() => salvarRespostaSimulado(tentativaId, atual.id, escolha, marcada))
        .catch(() => { toast.error("Não foi possível salvar a marcação para revisão."); });
    }
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= total) return;
    setIndiceAtual(index);
    setResultadoAtual(null);
    setMapOpen(false);
  };

  const finishExam = async () => {
    if (!questoes || submitting) return;
    setSubmitting(true);
    setConfirmFinish(false);
    try {
      if (isOfficial) await saveQueue.current;
      const result = isOfficial && tentativaId
        ? await finalizarSimuladoOficial(tentativaId)
        : await corrigirSimulado(questoes.map((q) => q.id), respostas, iniciadoEm);
      const byId = new Map(result.resultados.map((item) => [item.questao_id, item]));
      setHistorico(questoes.map((questao) => {
        const item = byId.get(questao.id)!;
        return {
          questao,
          escolha: item.escolha || "",
          acertou: item.acertou,
          em_branco: item.em_branco,
          gabarito_correto: item.gabarito_correto,
          feedback_prof: item.feedback_prof,
        };
      }));
      localStorage.removeItem(storageKey);
      setShowCompletion(true);
      setConfirmFinish(false);
    } catch {
      setConfirmFinish(false);
      toast.error("Não foi possível finalizar o simulado.", {
        description: "Suas respostas continuam salvas. Você pode tentar novamente ou sair da prova.",
      });
    } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (isExam && hasTimeLimit && remainingSeconds <= 0 && total > 0 && !showCompletion && !submitting) finishExam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, total, isExam, hasTimeLimit]);

  const confirmTraining = async () => {
    if (!atual || !escolha) return;
    setSubmitting(true);
    try {
      const result = await responderQuestao(atual.id, escolha);
      setResultadoAtual(result);
      setHistorico((items) => [...items, { questao: atual, escolha, acertou: result.acertou, gabarito_correto: result.gabarito_correto, feedback_prof: result.feedback_prof }]);
    } finally { setSubmitting(false); }
  };

  if (!email) return null;
  if (isLoading) return <div className="h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (isError || !questoes?.length) return <div className="h-screen grid place-items-center"><div className="text-center space-y-3"><p className="text-sm text-muted-foreground">Nenhuma questão disponível para estes filtros.</p><Button variant="outline" onClick={() => navigate("/simulado-filtros")}>Voltar</Button></div></div>;
  if (submitting && isExam) return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border bg-card p-7 text-center shadow-lg sm:p-9"
        role="status"
        aria-live="polite"
      >
        <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center">
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Corrigindo seu simulado</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Estamos analisando suas respostas e preparando o resultado por grande área.
        </p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full w-1/3 rounded-full bg-primary"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Isso pode levar alguns segundos.</p>
      </motion.div>
    </div>
  );
  if (showCompletion) return <SimuladoCompletion historico={historico} tempoSegundos={elapsed} tentativaId={isOfficial ? Number(tentativaId) : undefined} />;

  const alternativeStyle = (letter: string) => {
    const base = "w-full text-left p-3 rounded-lg border-2 transition-all flex flex-col items-stretch gap-2.5";
    if (!resultadoAtual) return `${base} ${escolha === letter ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-card hover:border-primary/50"}`;
    if (letter === resultadoAtual.gabarito_correto) return `${base} border-green-500 bg-green-500/10`;
    if (letter === escolha) return `${base} border-red-500 bg-red-500/10`;
    return `${base} border-border opacity-60`;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b shrink-0 gap-2">
        <button onClick={() => isExam ? setConfirmFinish(true) : navigate("/simulado-filtros")} className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="w-3.5 h-3.5" /> Sair</button>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2"><img src={logoIsotipo} alt="Logo" className="h-5" /><span className="truncate text-[11px] font-semibold sm:text-xs">Questão {indiceAtual + 1} de {total}</span></div>
        <div className="flex items-center gap-2">
          {isExam && <span className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${hasTimeLimit && remainingSeconds < 300 ? "text-destructive" : "text-foreground"}`}><Clock3 className="w-3.5 h-3.5" />{formatTime(hasTimeLimit ? remainingSeconds : elapsed)}</span>}
          {isExam && <Button variant="ghost" size="sm" className="xl:hidden" onClick={() => setMapOpen(true)} aria-label="Abrir mapa da prova"><ListChecks className="w-4 h-4" /></Button>}
          {isExam && <Button variant="ghost" size="sm" className="hidden xl:inline-flex" onClick={() => setSidebar((v) => !v)} aria-label="Alternar mapa da prova">{sidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}</Button>}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main className="scrollbar-subtle flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          <AnimatePresence mode="wait">
            <motion.div key={atual.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-muted-foreground">{[atual.instituicao, atual.ano].filter(Boolean).join(" · ")}</p>
                {isExam && <Button variant={marcadas.includes(atual.id) ? "secondary" : "ghost"} size="sm" className="text-[11px]" onClick={toggleMarked}><Bookmark className="w-3.5 h-3.5 mr-1" /> Revisar depois</Button>}
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line mb-4">{atual.enunciado}</p>
              {atual.img_url && <img src={atual.img_url} alt="Imagem da questão" className="max-h-56 mx-auto mb-4 rounded-lg border" />}
              <div className="space-y-2 mb-4">
                {Object.entries(atual.alternativas).map(([letter, raw]) => {
                  const content = parseAlternative(raw);
                  return <button key={letter} disabled={!!resultadoAtual} onClick={() => selectAnswer(letter)} className={alternativeStyle(letter)}><span className="flex items-start gap-2.5"><span className="shrink-0 w-6 h-6 rounded-full bg-muted grid place-items-center text-[10px] font-bold">{letter.toUpperCase()}</span><span className="flex-1 text-xs leading-relaxed pt-0.5">{content.text}</span>{resultadoAtual && letter === resultadoAtual.gabarito_correto && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}{resultadoAtual && letter === escolha && !resultadoAtual.acertou && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}</span>{!isOfficial && content.imageUrl && <img src={content.imageUrl} alt={content.imageAlt || `Imagem da alternativa ${letter.toUpperCase()}`} loading="lazy" className="max-h-52 w-full rounded-lg border border-border bg-white object-contain sm:max-h-64" />}</button>;
                })}
              </div>
              {!isExam && resultadoAtual?.feedback_prof && <FeedbackProfCard resultado={resultadoAtual} questaoId={atual.id} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {isExam && sidebar && <aside className="hidden w-72 shrink-0 overflow-hidden border-l bg-card p-4 xl:block"><SimuladoQuestionMap questoes={questoes} indiceAtual={indiceAtual} respostas={respostas} marcadas={marcadas} onSelect={goTo} /></aside>}
      </div>

      <footer className="shrink-0 px-3 sm:px-4 py-2 border-t bg-background">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" className="w-10 px-0 sm:w-auto sm:px-3" disabled={indiceAtual === 0} onClick={() => goTo(indiceAtual - 1)}><ArrowLeft className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Anterior</span></Button>
          {isExam ? <div className="flex min-w-0 gap-1.5 sm:gap-2"><Button variant="outline" size="sm" className="w-10 px-0 sm:w-auto sm:px-3" onClick={() => goTo(indiceAtual + 1)} disabled={indiceAtual === total - 1}><span className="hidden sm:inline">Próxima</span><ArrowRight className="w-3.5 h-3.5 sm:ml-1" /></Button><Button size="sm" className="px-3 sm:px-4" onClick={() => setConfirmFinish(true)}><span className="sm:hidden">Finalizar</span><span className="hidden sm:inline">Finalizar prova</span></Button></div> : !resultadoAtual ? <Button size="sm" disabled={!escolha || submitting} onClick={confirmTraining}>{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}Confirmar Resposta</Button> : <Button size="sm" onClick={() => indiceAtual === total - 1 ? setShowCompletion(true) : goTo(indiceAtual + 1)}>{indiceAtual === total - 1 ? "Ver Resultado" : "Próxima Questão"}</Button>}
        </div>
      </footer>

      <Sheet open={mapOpen} onOpenChange={setMapOpen}>
        <SheetContent
          side="bottom"
          className="inset-x-2 bottom-2 h-[min(78vh,calc(100dvh-1rem))] w-auto max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl p-3 sm:inset-x-4 sm:bottom-4 sm:mx-auto sm:h-[70vh] sm:max-w-xl sm:p-4"
        >
          <SheetHeader className="sr-only"><SheetTitle>Mapa da prova</SheetTitle><SheetDescription>Navegue pelas questões do simulado.</SheetDescription></SheetHeader>
          {questoes && <SimuladoQuestionMap questoes={questoes} indiceAtual={indiceAtual} respostas={respostas} marcadas={marcadas} onSelect={goTo} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg min-w-0 overflow-y-auto rounded-2xl p-5 sm:p-6">
          <AlertDialogHeader className="min-w-0">
            <AlertDialogTitle>Finalizar o simulado?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Você respondeu {respondidas} de {total} questões. {mensagemEmBranco} Após finalizar, o gabarito e os comentários serão liberados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="min-w-0">
            <AlertDialogCancel className="w-full sm:w-auto">Continuar prova</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto" onClick={finishExam} disabled={submitting}>{submitting ? "Corrigindo..." : "Finalizar e corrigir"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimuladoView;
