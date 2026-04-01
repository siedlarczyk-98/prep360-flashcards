import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, MessageSquareText, ThumbsUp, ThumbsDown, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchQuestoes, responderQuestao, enviarFeedbackProf, type Questao, type ResultadoResposta } from "@/lib/api";
import SimuladoCompletion, { type RespostaHistorico } from "@/components/SimuladoCompletion";
import logoIsotipo from "@/assets/logo-isotipo.png";

const FeedbackProfCard = ({ resultadoAPI, questaoId }: { resultadoAPI: ResultadoResposta; questaoId: number }) => {
  const [feedbackState, setFeedbackState] = useState<boolean | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleFeedback = async (util: boolean) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await enviarFeedbackProf(questaoId, util);
      setFeedbackState(util);
    } catch {
      console.error("Erro ao enviar feedback do professor");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-muted/50 p-3 mb-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <MessageSquareText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground">Comentário do Professor</span>
        {resultadoAPI.acertou ? (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-700 font-semibold ml-auto">✓ Correto</span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-700 font-semibold ml-auto">✗ Incorreto</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{resultadoAPI.feedback_prof}</p>
      <div className="border-t border-border mt-3 pt-2.5 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Esse comentário foi útil?</span>
        {feedbackState === null ? (
          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant="ghost" size="sm" disabled={isSending} onClick={() => handleFeedback(true)} className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-green-600"><ThumbsUp className="w-3.5 h-3.5" /> Sim</Button>
            <Button variant="ghost" size="sm" disabled={isSending} onClick={() => handleFeedback(false)} className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-red-600"><ThumbsDown className="w-3.5 h-3.5" /> Não</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant={feedbackState === true ? "default" : "ghost"} size="sm" onClick={() => feedbackState !== true && handleFeedback(true)} disabled={isSending} className={`h-7 px-2.5 text-[11px] gap-1 ${feedbackState === true ? "bg-green-600 hover:bg-green-700 text-white" : "opacity-40 text-muted-foreground"}`}><ThumbsUp className="w-3.5 h-3.5" /> Sim</Button>
            <Button variant={feedbackState === false ? "default" : "ghost"} size="sm" onClick={() => feedbackState !== false && handleFeedback(false)} disabled={isSending} className={`h-7 px-2.5 text-[11px] gap-1 ${feedbackState === false ? "bg-red-600 hover:bg-red-700 text-white" : "opacity-40 text-muted-foreground"}`}><ThumbsDown className="w-3.5 h-3.5" /> Não</Button>
            <span className="text-[10px] text-muted-foreground ml-1">Obrigado pelo feedback!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SimuladoView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = localStorage.getItem("userEmail") || "";

  const modoParam = searchParams.get("modo") || undefined;
  const aulaId = searchParams.get("aula_id") || undefined;
  const grandeArea = searchParams.get("grande_area") || undefined;
  const instituicao = searchParams.get("instituicao") || undefined;
  const limite = searchParams.get("limite") ? Number(searchParams.get("limite")) : undefined;

  // Determine initial tab from URL param
  const initialTab = modoParam === "essenciais" ? "essenciais" : "todas";
  const [activeTab, setActiveTab] = useState<"essenciais" | "todas">(initialTab);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [escolhaUsuario, setEscolhaUsuario] = useState<string | null>(null);
  const [resultadoAPI, setResultadoAPI] = useState<ResultadoResposta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historico, setHistorico] = useState<RespostaHistorico[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  // Fetch essenciais
  const { data: questoesEssenciais, isLoading: loadingEss } = useQuery({
    queryKey: ["questoes-simulado-ess", email, aulaId],
    queryFn: () => fetchQuestoes({ aula_id: aulaId, modo: "essenciais" }),
    enabled: !!email && !!aulaId,
  });

  // Fetch todas
  const { data: questoesTodas, isLoading: loadingTodas } = useQuery({
    queryKey: ["questoes-simulado-todas", email, modoParam, aulaId, grandeArea, instituicao, limite],
    queryFn: () => fetchQuestoes({ aula_id: aulaId, grande_area: grandeArea, instituicao, limite, modo: modoParam === "essenciais" ? "todas" : modoParam }),
    enabled: !!email,
  });

  const hasEssenciais = (questoesEssenciais?.length ?? 0) > 0;
  const showTabs = !!aulaId && hasEssenciais;

  // Active question list based on tab
  const questoes = showTabs && activeTab === "essenciais" ? questoesEssenciais : questoesTodas;
  const isLoading = showTabs && activeTab === "essenciais" ? loadingEss : loadingTodas;

  // Reset index when switching tabs
  const handleTabChange = (tab: "essenciais" | "todas") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIndiceAtual(0);
    setEscolhaUsuario(null);
    setResultadoAPI(null);
  };

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  // If essenciais were requested but none exist, fall back to todas
  useEffect(() => {
    if (!loadingEss && activeTab === "essenciais" && !hasEssenciais) {
      setActiveTab("todas");
    }
  }, [loadingEss, hasEssenciais, activeTab]);

  if (!email) return null;

  const questaoAtual: Questao | undefined = questoes?.[indiceAtual];
  const totalQuestoes = questoes?.length ?? 0;
  const isLastQuestion = indiceAtual >= totalQuestoes - 1;

  const handleSelect = (letra: string) => {
    if (resultadoAPI) return;
    setEscolhaUsuario(letra);
  };

  const handleConfirm = async () => {
    if (!escolhaUsuario || !questaoAtual || !email) return;
    setIsSubmitting(true);
    try {
      const resultado = await responderQuestao(questaoAtual.id, escolhaUsuario);
      setResultadoAPI(resultado);
      setHistorico((prev) => [...prev, { questao: questaoAtual, escolha: escolhaUsuario, acertou: resultado.acertou, gabarito_correto: resultado.gabarito_correto, feedback_prof: resultado.feedback_prof, percentual_global_acerto: resultado.percentual_global_acerto }]);
    } catch {
      const fallback: ResultadoResposta = { acertou: false, gabarito_correto: "", feedback_prof: "Não foi possível obter o feedback." };
      setResultadoAPI(fallback);
      setHistorico((prev) => [...prev, { questao: questaoAtual, escolha: escolhaUsuario, acertou: false, gabarito_correto: "", feedback_prof: fallback.feedback_prof }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) { setShowCompletion(true); return; }
    setIndiceAtual((i) => i + 1);
    setEscolhaUsuario(null);
    setResultadoAPI(null);
  };

  const getAlternativeStyle = (letra: string) => {
    const base = "w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-start gap-2.5";
    if (!resultadoAPI) {
      if (escolhaUsuario === letra) return `${base} border-primary bg-primary/10 ring-2 ring-primary/30`;
      return `${base} border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer`;
    }
    if (letra === resultadoAPI.gabarito_correto) return `${base} border-green-500 bg-green-500/10`;
    if (letra === escolhaUsuario && !resultadoAPI.acertou) return `${base} border-red-500 bg-red-500/10`;
    return `${base} border-border bg-card opacity-60`;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!questoes || questoes.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-sm text-muted-foreground">Nenhuma questão disponível no momento.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/hub")}>Voltar ao Hub</Button>
      </div>
    );
  }

  if (showCompletion) return <SimuladoCompletion historico={historico} />;

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <button onClick={() => navigate("/hub")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>
        <div className="flex items-center gap-1.5">
          <img src={logoIsotipo} alt="Logo" className="h-5 w-auto" />
          <span className="text-xs font-semibold text-foreground">Questão {indiceAtual + 1} de {totalQuestoes}</span>
        </div>
        {questaoAtual && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium">
            {questaoAtual.grande_area || questaoAtual.aula_nome}
          </span>
        )}
      </header>

      {/* Tabs - only show when aula has essenciais */}
      {showTabs && (
        <div className="flex items-center border-b border-border px-4 shrink-0">
          <button
            onClick={() => handleTabChange("essenciais")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${activeTab === "essenciais" ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Star className="w-3.5 h-3.5" />
            Essenciais ({questoesEssenciais?.length ?? 0})
          </button>
          <button
            onClick={() => handleTabChange("todas")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${activeTab === "todas" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Rocket className="w-3.5 h-3.5" />
            Todas ({questoesTodas?.length ?? 0})
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-3">
        <AnimatePresence mode="wait">
          {questaoAtual && (
            <motion.div
              key={`${activeTab}-${questaoAtual.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {(questaoAtual.instituicao || questaoAtual.ano) && (
                  <p className="text-[10px] text-muted-foreground">
                    {[questaoAtual.instituicao, questaoAtual.ano].filter(Boolean).join(" · ")}
                  </p>
                )}
                {questaoAtual.essencial && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 font-semibold flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5" /> Essencial
                  </span>
                )}
                {questaoAtual.respondida && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    Já respondida
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">{questaoAtual.enunciado}</p>
                {questaoAtual.img_url && (
                  <img src={questaoAtual.img_url} alt="Imagem da questão" className="mt-2 max-h-36 rounded-lg border border-border object-contain mx-auto" />
                )}
              </div>
              <div className="space-y-2 mb-4">
                {Object.entries(questaoAtual.alternativas).map(([letra, texto]) => (
                  <button key={letra} onClick={() => handleSelect(letra)} disabled={!!resultadoAPI} className={getAlternativeStyle(letra)}>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">{letra.toUpperCase()}</span>
                    <span className="text-xs text-foreground leading-relaxed pt-0.5">{texto}</span>
                    {resultadoAPI && letra === resultadoAPI.gabarito_correto && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
                    {resultadoAPI && letra === escolhaUsuario && !resultadoAPI.acertou && <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-auto" />}
                  </button>
                ))}
              </div>
              {resultadoAPI && resultadoAPI.feedback_prof && (
                <FeedbackProfCard resultadoAPI={resultadoAPI} questaoId={questaoAtual.id} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="shrink-0 px-4 py-2 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto flex justify-end">
          {!resultadoAPI ? (
            <Button size="sm" disabled={!escolhaUsuario || isSubmitting} onClick={handleConfirm} className="min-w-[10rem] gap-1.5 h-9 text-xs">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar Resposta
            </Button>
          ) : (
            <Button size="sm" onClick={handleNext} className="min-w-[10rem] h-9 text-xs">
              {isLastQuestion ? "Ver Resultado" : "Próxima Questão"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default SimuladoView;
