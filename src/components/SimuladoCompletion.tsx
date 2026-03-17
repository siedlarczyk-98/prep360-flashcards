import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowLeft, MessageSquareText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Questao } from "@/lib/api";

export interface RespostaHistorico {
  questao: Questao;
  escolha: string;
  acertou: boolean;
  gabarito_correto: string;
  feedback_prof: string;
  percentual_global_acerto?: number;
}

interface SimuladoCompletionProps {
  historico: RespostaHistorico[];
}

const safe = (v: number | undefined | null): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SimuladoCompletion = ({ historico }: SimuladoCompletionProps) => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const totalQuestoes = historico.length;
  const acertos = historico.filter((r) => r.acertou).length;
  const erros = totalQuestoes - acertos;
  const percentual = totalQuestoes > 0 ? Math.round((acertos / totalQuestoes) * 100) : 0;
  const questoesErradas = historico.filter((r) => !r.acertou);

  const starCount = percentual >= 80 ? 3 : percentual >= 50 ? 2 : 1;
  const starMessage =
    percentual >= 80 ? "Excelente!" : percentual >= 50 ? "Bom trabalho!" : "Vamos reforçar!";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const acertosDash = totalQuestoes > 0 ? (acertos / totalQuestoes) * circumference : 0;
  const errosDash = totalQuestoes > 0 ? (erros / totalQuestoes) * circumference : 0;

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Stars + Title */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center gap-1"
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 300 }}
                >
                  <Star
                    className={`w-10 h-10 ${i === 2 ? "w-12 h-12" : ""} ${
                      i <= starCount
                        ? "text-yellow-400 fill-yellow-400 drop-shadow-md"
                        : "text-muted stroke-muted-foreground/30"
                    }`}
                  />
                </motion.div>
              ))}
            </motion.div>
            <h1 className="text-xl font-bold text-foreground">Sessão Concluída!</h1>
            <p className="text-sm font-medium text-primary">{starMessage}</p>
          </div>

          {/* Donut + Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative shrink-0">
                <svg width="120" height="120" viewBox="0 0 140 140" className="-rotate-90">
                  <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="12" className="stroke-muted" />
                  <motion.circle
                    cx="70" cy="70" r={radius} fill="none" strokeWidth="12" strokeLinecap="round"
                    className="stroke-primary"
                    strokeDasharray={`${acertosDash} ${circumference}`}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                  {erros > 0 && (
                    <motion.circle
                      cx="70" cy="70" r={radius} fill="none" strokeWidth="12" strokeLinecap="round"
                      className="stroke-destructive"
                      strokeDasharray={`${errosDash} ${circumference}`}
                      strokeDashoffset={-acertosDash}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.4 }}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="text-2xl font-black text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {safe(percentual)}%
                  </motion.span>
                  <span className="text-[9px] text-muted-foreground font-medium">APROVEIT.</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-primary">Acertos</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{safe(acertos)}</p>
                  <p className="text-[10px] text-muted-foreground">de {safe(totalQuestoes)}</p>
                </div>
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-[11px] font-semibold text-destructive">Erros</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{safe(erros)}</p>
                  <p className="text-[10px] text-muted-foreground">de {safe(totalQuestoes)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error Review */}
          {questoesErradas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                📝 Revisão dos Erros ({questoesErradas.length})
              </h2>
              <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
                {questoesErradas.map((item, idx) => (
                  <AccordionItem
                    key={item.questao.id}
                    value={`q-${item.questao.id}`}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left w-full">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-foreground line-clamp-1 flex-1">
                          {item.questao.enunciado.slice(0, 80)}...
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                        {item.questao.enunciado}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                          <p className="text-[10px] font-semibold text-destructive uppercase mb-1">Sua Resposta</p>
                          <p className="text-xs text-foreground">
                            <span className="font-bold">{item.escolha.toUpperCase()})</span>{" "}
                            {item.questao.alternativas[item.escolha] || "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                          <p className="text-[10px] font-semibold text-primary uppercase mb-1">Gabarito Correto</p>
                          <p className="text-xs text-foreground">
                            <span className="font-bold">{item.gabarito_correto.toUpperCase()})</span>{" "}
                            {item.questao.alternativas[item.gabarito_correto] || "—"}
                          </p>
                        </div>
                      </div>

                      {item.feedback_prof && (
                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <MessageSquareText className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-semibold text-foreground uppercase">
                              Comentário do Professor
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                            {item.feedback_prof}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          )}

          {questoesErradas.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"
            >
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Nenhum erro! Gabaritou! 🎉</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      <footer className="shrink-0 px-6 py-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="w-full h-12 text-sm font-semibold gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Finalizar e Voltar ao Dashboard
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default SimuladoCompletion;
