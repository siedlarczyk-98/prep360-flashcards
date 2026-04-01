import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Brain, Target, Loader2, Flame, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  fetchCardsForToday,
  fetchResumoSemanal,
  fetchResumoHome,
  fetchOnboardingWeb,
  marcarOnboardingWeb,
} from "@/lib/api";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

const StudyHub = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail") || "";
  const tourRef = useRef<any>(null);

  const { data: cardsHoje, isLoading: loadingCards } = useQuery({
    queryKey: ["cards-hoje", email],
    queryFn: () => fetchCardsForToday(),
    enabled: !!email,
  });

  const { data: resumoHome, isLoading: loadingResumoHome } = useQuery({
    queryKey: ["resumo-home", email],
    queryFn: () => fetchResumoHome(),
    enabled: !!email,
  });

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo-semanal", email],
    queryFn: () => fetchResumoSemanal(),
    enabled: !!email,
  });

  const { data: onboardingFeito } = useQuery({
    queryKey: ["onboarding-web", email],
    queryFn: fetchOnboardingWeb,
    enabled: !!email,
  });

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    const interessesDefinidos = localStorage.getItem("interesses_definidos");
    if (onboardingFeito === false && !loadingCards && !loadingResumoHome && interessesDefinidos) {
      iniciarTour();
    }
  }, [onboardingFeito, loadingCards, loadingResumoHome]);

  const iniciarTour = () => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
        classes: "shepherd-theme-arrows",
      },
    });

    tour.addStep({
      id: "boas-vindas",
      text: "Bem-vindo à <strong>Trilha ENAMED Paciente 360</strong>! Vamos te mostrar como funciona a plataforma em alguns passos rápidos.",
      buttons: [
        { text: "Pular", action: () => { tour.cancel(); marcarOnboardingWeb(); }, secondary: true },
        { text: "Começar →", action: tour.next },
      ],
    });

    tour.addStep({
      id: "flashcards",
      text: "🧠 Aqui você acessa nossos <strong>Flashcards</strong>. O sistema inteligente sabe exatamente quais cards você precisa revisar hoje.",
      attachTo: { element: "[data-tour='flashcards']", on: "bottom" },
      buttons: [
        { text: "← Voltar", action: tour.back, secondary: true },
        { text: "Próximo →", action: tour.next },
      ],
    });

    tour.addStep({
      id: "como-funciona-flashcard",
      text: `<div style="text-align: center"><img src="https://s3-sa-east-1.amazonaws.com/avp-development/cursos/materiais_auxiliares/flashcards21774635691904.png" alt="Flashcards" style="width: 100%; border-radius: 10px; margin-bottom: 10px; object-fit: cover;" /><p style="font-size: 12px; color: hsl(215 15% 50%); margin: 0">Os flashcards usam repetição espaçada para fixar o conteúdo na memória de longo prazo.</p></div>`,
      buttons: [
        { text: "← Voltar", action: tour.back, secondary: true },
        { text: "Próximo →", action: tour.next },
      ],
    });

    tour.addStep({
      id: "questoes",
      text: "🎯 Aqui você treina com <strong>questões reais</strong> de provas. Escolha por área, banca ou tema.",
      attachTo: { element: "[data-tour='questoes']", on: "bottom" },
      buttons: [
        { text: "← Voltar", action: tour.back, secondary: true },
        { text: "Próximo →", action: tour.next },
      ],
    });

    tour.addStep({
      id: "progresso",
      text: "📊 Acompanhe aqui seu <strong>progresso dos últimos 7 dias</strong>.",
      attachTo: { element: "[data-tour='progresso']", on: "top" },
      buttons: [
        { text: "← Voltar", action: tour.back, secondary: true },
        { text: "Próximo →", action: tour.next },
      ],
    });

    tour.addStep({
      id: "navegacao",
      text: "🗺️ Use o menu lateral para navegar entre <strong>Agenda, Métricas e mais</strong>.",
      buttons: [
        { text: "← Voltar", action: tour.back, secondary: true },
        { text: "Concluir ✓", action: tour.next },
      ],
    });

    tour.on("cancel", () => marcarOnboardingWeb());
    tour.on("complete", () => marcarOnboardingWeb());
    tourRef.current = tour;
    tour.start();
  };

  if (!email) return null;

  const firstName = email.split("@")[0].split(/[._]/)[0];
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const flashcardsFeitos = resumo?.flashcards ?? 0;
  const questoesRespondidas = resumo?.questoes ?? 0;
  const temAtividade = flashcardsFeitos > 0 || questoesRespondidas > 0;

  // Essenciais / Turbinado data
  const essTotal = resumoHome?.essenciais_total ?? 0;
  const essPendentes = resumoHome?.essenciais_pendentes ?? 0;
  const essFeitas = essTotal - essPendentes;
  const essCompleto = essTotal > 0 && essPendentes === 0;
  const turbDisp = resumoHome?.turbinado_disponiveis ?? 0;
  const totalQ = resumoHome?.total_questoes ?? 0;
  const temEssenciais = essTotal > 0;

  const handleEssenciais = () => {
    if (!resumoHome) return;
    const params = new URLSearchParams();
    params.append("aula_id", String(resumoHome.aula_id));
    params.append("modo", "essenciais");
    navigate(`/simulado?${params.toString()}`);
  };

  const handleTurbinado = () => {
    if (!resumoHome) return;
    const params = new URLSearchParams();
    params.append("aula_id", String(resumoHome.aula_id));
    params.append("modo", "todas");
    navigate(`/simulado?${params.toString()}`);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background bg-circles-pattern overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-4 relative z-[1]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-center mb-5">
          <h1 className="text-xl font-bold text-foreground">Olá, {capitalizedName}!</h1>
          <p className="text-muted-foreground mt-0.5 text-xs font-light">Escolha seu modo de treino para hoje.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Flashcards Card */}
          <motion.div
            data-tour="flashcards"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-xl border border-border bg-card p-4 flex flex-col cursor-pointer group"
            style={{ boxShadow: "var(--shadow-card)" }}
            onClick={() => navigate("/dashboard")}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--secondary) / 0.7))" }}>
                <Brain className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Revisão Espaçada</h2>
                <p className="text-[10px] text-muted-foreground">Fixe o conteúdo na memória de longo prazo.</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center py-2">
              {loadingCards ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-secondary">{cardsHoje?.length ?? 0}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">cards pendentes</p>
                </div>
              )}
            </div>
            <Button
              className="w-full h-9 text-xs font-semibold gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg group-hover:shadow-lg transition-shadow"
              onClick={(e) => { e.stopPropagation(); navigate("/dashboard"); }}
            >
              <Brain className="w-3.5 h-3.5" />
              Iniciar Flashcards
            </Button>
          </motion.div>

          {/* Questões Card - Essenciais + Turbinado */}
          <motion.div
            data-tour="questoes"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 flex flex-col"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.7))" }}>
                <Target className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Treino com Questões</h2>
                <p className="text-[10px] text-muted-foreground">Teste seus conhecimentos com questões reais.</p>
              </div>
            </div>

            {loadingResumoHome ? (
              <div className="flex-1 flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : !resumoHome ? (
              <div className="flex-1 flex flex-col items-center justify-center py-2">
                <p className="text-xs text-muted-foreground">Nenhuma questão disponível.</p>
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => navigate("/simulado-filtros")}>
                  Ver todas as aulas
                </Button>
              </div>
            ) : temEssenciais ? (
              /* Two sub-blocks: Essenciais + Turbinado */
              <div className="flex-1 grid grid-cols-2 gap-2">
                {/* Essenciais */}
                <div className={`rounded-lg border p-3 flex flex-col ${essCompleto ? "border-green-500/40 bg-green-500/5" : "border-orange-500/40 bg-orange-500/5"}`}>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Star className={`w-3.5 h-3.5 ${essCompleto ? "text-green-500" : "text-orange-500"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Essenciais</span>
                  </div>
                  {!essCompleto && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 font-semibold w-fit mb-1.5">
                      Recomendado
                    </span>
                  )}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {essCompleto ? (
                      <span className="text-sm font-bold text-green-600">✅ Completo!</span>
                    ) : (
                      <>
                        <span className="text-2xl font-extrabold text-foreground">{essPendentes}/{essTotal}</span>
                        <p className="text-[10px] text-muted-foreground">pendentes</p>
                      </>
                    )}
                  </div>
                  <Progress value={essTotal > 0 ? (essFeitas / essTotal) * 100 : 0} className="h-1.5 mb-2" />
                  <Button
                    size="sm"
                    className="w-full h-7 text-[10px] font-semibold gap-1"
                    variant={essCompleto ? "outline" : "default"}
                    onClick={(e) => { e.stopPropagation(); handleEssenciais(); }}
                  >
                    <Star className="w-3 h-3" />
                    {essCompleto ? "Revisar" : "Começar"}
                  </Button>
                </div>

                {/* Turbinado */}
                <div className={`rounded-lg border p-3 flex flex-col ${essCompleto ? "border-accent/40 bg-accent/5" : "border-border"}`}>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Rocket className={`w-3.5 h-3.5 ${essCompleto ? "text-accent" : "text-muted-foreground"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Turbinado</span>
                  </div>
                  {essCompleto && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-semibold w-fit mb-1.5">
                      Recomendado
                    </span>
                  )}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-foreground">{turbDisp}</span>
                    <p className="text-[10px] text-muted-foreground">disponíveis</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[10px] font-semibold gap-1 mt-auto"
                    onClick={(e) => { e.stopPropagation(); handleTurbinado(); }}
                  >
                    <Rocket className="w-3 h-3" />
                    Praticar
                  </Button>
                </div>
              </div>
            ) : (
              /* Fallback: no essenciais, show only turbinado/total */
              <div className="flex-1 flex flex-col items-center justify-center py-2">
                <span className="text-3xl font-extrabold text-accent">{totalQ}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">questões disponíveis</p>
                <Button
                  className="w-full h-9 text-xs font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg mt-3"
                  onClick={(e) => { e.stopPropagation(); handleTurbinado(); }}
                >
                  <Target className="w-3.5 h-3.5" />
                  Praticar Questões
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Progress section */}
        <motion.div data-tour="progresso" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="w-full max-w-2xl mt-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Seu Progresso nos Últimos 7 Dias</h3>
          {loadingResumo ? (
            <div className="flex justify-center py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /></div>
          ) : temAtividade ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0"><Flame className="w-4 h-4 text-secondary" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{flashcardsFeitos}</p>
                  <p className="text-[10px] text-muted-foreground">Flashcards Feitos</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Target className="w-4 h-4 text-accent" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{questoesRespondidas}</p>
                  <p className="text-[10px] text-muted-foreground">Questões Respondidas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 rounded-xl border border-dashed border-border bg-card/50">
              <p className="text-xs text-muted-foreground">🚀 Comece sua meta de hoje!</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default StudyHub;
