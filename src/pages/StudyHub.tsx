import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Target, Loader2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCardsForToday, fetchQuestoes, fetchResumoSemanal } from "@/lib/api";

const StudyHub = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail") || "";

  const { data: cardsHoje, isLoading: loadingCards } = useQuery({
    queryKey: ["cards-hoje", email],
    queryFn: () => fetchCardsForToday(email),
    enabled: !!email,
  });

  const { data: questoes, isLoading: loadingQuestoes } = useQuery({
    queryKey: ["questoes", email],
    queryFn: () => fetchQuestoes({ email, apenas_liberadas: true }),
    enabled: !!email,
  });

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo-semanal", email],
    queryFn: () => fetchResumoSemanal(email),
    enabled: !!email,
  });

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  if (!email) return null;


  const firstName = email.split("@")[0].split(/[._]/)[0];
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const flashcardsFeitos = resumo?.flashcards ?? 0;
  const questoesRespondidas = resumo?.questoes ?? 0;
  const temAtividade = flashcardsFeitos > 0 || questoesRespondidas > 0;

  return (
    <div className="h-full w-full flex flex-col bg-background bg-circles-pattern overflow-hidden">

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-4 relative z-[1]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-5"
        >
          <h1 className="text-xl font-bold text-foreground">
            Olá, {capitalizedName}!
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs font-light">
            Escolha seu modo de treino para hoje.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-xl border border-border bg-card p-4 flex flex-col cursor-pointer group"
            style={{ boxShadow: "var(--shadow-card)" }}
            onClick={() => navigate("/dashboard")}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--secondary) / 0.7))" }}
              >
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
                  <span className="text-3xl font-extrabold text-secondary">
                    {cardsHoje?.length ?? 0}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">cards pendentes</p>
                </div>
              )}
            </div>

            <Button
              className="w-full h-9 text-xs font-semibold gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg group-hover:shadow-lg transition-shadow"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/dashboard");
              }}
            >
              <Brain className="w-3.5 h-3.5" />
              Iniciar Flashcards
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-xl border border-border bg-card p-4 flex flex-col cursor-pointer group"
            style={{ boxShadow: "var(--shadow-card)" }}
            onClick={() => navigate("/simulado-filtros")}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.7))" }}
              >
                <Target className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Treino com Questões</h2>
                <p className="text-[10px] text-muted-foreground">Teste seus conhecimentos com questões reais.</p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center py-2">
              {loadingQuestoes ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-accent">
                    {questoes?.length ?? 0}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">questões liberadas</p>
                </div>
              )}
            </div>

            <Button
              className="w-full h-9 text-xs font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg group-hover:shadow-lg transition-shadow"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/simulado-filtros");
              }}
            >
              <Target className="w-3.5 h-3.5" />
              Praticar Questões
            </Button>
          </motion.div>
        </div>

        {/* Seção: Progresso dos Últimos 7 Dias */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full max-w-2xl mt-4"
        >
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
            Seu Progresso nos Últimos 7 Dias
          </h3>

          {loadingResumo ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : temAtividade ? (
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{flashcardsFeitos}</p>
                  <p className="text-[10px] text-muted-foreground">Flashcards Feitos</p>
                </div>
              </div>
              <div
                className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{questoesRespondidas}</p>
                  <p className="text-[10px] text-muted-foreground">Questões Respondidas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 rounded-xl border border-dashed border-border bg-card/50">
              <p className="text-xs text-muted-foreground">
                🚀 Comece sua meta de hoje!
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default StudyHub;
