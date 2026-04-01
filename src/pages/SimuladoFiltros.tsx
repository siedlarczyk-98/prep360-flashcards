import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Loader2, BookOpen, Globe, ClipboardList, Search, Info, Target, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchAulasComQuestoes, fetchInstituicoes } from "@/lib/api";
import logoIsotipo from "@/assets/logo-isotipo.png";

type Modo = "pos-aula" | "grande-area" | "simulado-real";

const MODOS = [
  { value: "pos-aula" as Modo, label: "Conteúdo Pós-Aula", icon: BookOpen, tooltip: "Foque no conteúdo que você acabou de ver." },
  { value: "grande-area" as Modo, label: "Por Grande Área", icon: Globe, tooltip: "20 questões aleatórias sobre uma das 5 grandes áreas" },
  { value: "simulado-real" as Modo, label: "Modo Simulado", icon: ClipboardList, tooltip: "Treine como no dia da prova. Escolha o nº de questões" },
];

const GRANDES_AREAS = ["Clínica Médica", "Cirurgia", "Ginecologia e Obstetrícia", "Pediatria", "Medicina Preventiva"];
const LIMITES = [10, 20, 40, 60, 80, 120];

const SimuladoFiltros = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail") || "";

  const [modo, setModo] = useState<Modo | null>(null);
  const [aulaId, setAulaId] = useState<string>("");
  const [aulaBusca, setAulaBusca] = useState("");
  const [grandeArea, setGrandeArea] = useState<string>("");
  const [instituicao, setInstituicao] = useState<string>("");
  const [limite, setLimite] = useState<number>(20);

  const { data: aulasDisponiveis = [], isLoading } = useQuery({
    queryKey: ["aulas-com-questoes", email],
    queryFn: () => fetchAulasComQuestoes(),
    enabled: !!email && modo === "pos-aula"
  });

  const { data: instituicoes = [], isLoading: isLoadingInst } = useQuery({
    queryKey: ["instituicoes", email],
    queryFn: fetchInstituicoes,
    enabled: modo === "simulado-real"
  });

  const aulasFiltradas = useMemo(() => {
    if (!aulaBusca.trim()) return aulasDisponiveis;
    const q = aulaBusca.toLowerCase();
    return aulasDisponiveis.filter((d) => d.aula_nome.toLowerCase().includes(q) || d.aula_id.toLowerCase().includes(q));
  }, [aulasDisponiveis, aulaBusca]);

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  if (!email) return null;

  const canStart =
    modo === "pos-aula" && aulaId ||
    modo === "grande-area" && grandeArea ||
    modo === "simulado-real" && instituicao;

  const handleIniciar = () => {
    if (!canStart) return;
    const params = new URLSearchParams();
    if (modo === "pos-aula") {
      params.append("aula_id", aulaId);
      params.append("limite", "20");
    } else if (modo === "grande-area") {
      params.append("modo", "grande_area");
      params.append("grande_area", grandeArea);
      params.append("limite", "20");
    } else if (modo === "simulado-real") {
      params.append("modo", "simulado");
      params.append("instituicao", instituicao);
      params.append("limite", limite.toString());
    }
    navigate(`/simulado?${params.toString()}`);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full w-full flex flex-col bg-background bg-circles-pattern overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Step 1: Modo */}
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">1. Escolha o Modo de Estudo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {MODOS.map((m) => {
                  const active = modo === m.value;
                  const Icon = m.icon;
                  return (
                    <Tooltip key={m.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { setModo(m.value); setAulaId(""); setAulaBusca(""); setGrandeArea(""); setInstituicao(""); setLimite(20); }}
                          className={`relative group rounded-xl border-2 p-4 text-left transition-all duration-200 ${active ? "border-accent bg-accent/5 shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]" : "border-border bg-card hover:border-accent/40 hover:shadow-md"}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <Info className="w-3 h-3 text-muted-foreground/50" />
                          </div>
                          <p className="text-xs font-bold mt-2 text-foreground">{m.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-2 text-center">{m.tooltip}</p>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] text-[11px]">{m.tooltip}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </motion.section>

            {/* Step 2: Conditional Filters */}
            <AnimatePresence mode="wait">
              {modo === "pos-aula" && (
                <motion.section key="pos-aula" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">2. Busque sua Aula</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Digite o nome ou ID da aula..." value={aulaBusca} onChange={(e) => setAulaBusca(e.target.value)} className="pl-9 h-10 text-xs rounded-xl border-2 border-border bg-card focus:border-accent" />
                  </div>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-3">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[11px]">Carregando aulas...</span>
                    </div>
                  ) : (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1 pr-1">
                      {aulasFiltradas.length > 0 ? (
                        aulasFiltradas.map((d) => {
                          const hasEss = (d.total_essenciais ?? 0) > 0;
                          const essResp = d.essenciais_respondidas ?? 0;
                          const essTot = d.total_essenciais ?? 0;
                          const essPend = d.essenciais_pendentes ?? 0;
                          const essComplete = hasEss && essPend === 0;
                          const progressPct = essTot > 0 ? (essResp / essTot) * 100 : 0;

                          return (
                            <button
                              key={d.aula_id}
                              onClick={() => setAulaId(d.aula_id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all ${aulaId === d.aula_id ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-foreground hover:border-accent/30"}`}
                            >
                              <span className="font-semibold block">{d.aula_nome}</span>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {hasEss ? (
                                  <>
                                    <span className={`text-[10px] flex items-center gap-0.5 ${essComplete ? "text-green-600" : "text-orange-600"}`}>
                                      {essComplete ? <CheckCircle2 className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                                      {essResp}/{essTot} essenciais
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">· {d.total_questoes} questões no total</span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">{d.total_questoes} questões</span>
                                )}
                              </div>
                              {hasEss && (
                                <Progress value={progressPct} className="h-1 mt-1.5" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-[11px] text-muted-foreground py-2">Nenhuma aula encontrada.</p>
                      )}
                    </div>
                  )}
                </motion.section>
              )}

              {modo === "grande-area" && (
                <motion.section key="grande-area" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">2. Selecione a Grande Área</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GRANDES_AREAS.map((area) => (
                      <button key={area} onClick={() => setGrandeArea(area)} className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition-all text-left ${grandeArea === area ? "border-secondary bg-secondary/10 text-secondary shadow-[0_0_0_3px_hsl(var(--secondary)/0.12)]" : "border-border bg-card text-foreground hover:border-secondary/40"}`}>
                        {area}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Serão selecionadas <strong className="text-foreground">20 questões</strong> aleatórias da área escolhida.</p>
                </motion.section>
              )}

              {modo === "simulado-real" && (
                <motion.section key="simulado-real" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <div>
                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">2. Selecione a Instituição</h2>
                    {isLoadingInst ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="text-[11px]">Carregando instituições...</span></div>
                    ) : (
                      <Select value={instituicao} onValueChange={setInstituicao}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-border bg-card text-xs font-medium focus:border-primary"><SelectValue placeholder="Escolha uma instituição..." /></SelectTrigger>
                        <SelectContent>{instituicoes.map((inst) => (<SelectItem key={inst} value={inst} className="text-xs font-medium">{inst}</SelectItem>))}</SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">3. Quantidade de Questões</h2>
                    <div className="flex flex-wrap gap-2">
                      {LIMITES.map((l) => (
                        <button key={l} onClick={() => setLimite(l)} className={`w-12 h-12 rounded-lg border-2 text-xs font-bold transition-all ${limite === l ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:border-accent/40"}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="shrink-0 px-4 py-2.5 border-t border-border bg-background">
          <div className="max-w-2xl mx-auto">
            <Button size="lg" onClick={handleIniciar} disabled={!canStart} className="w-full h-10 text-xs font-semibold gap-2 disabled:opacity-40">
              <Play className="w-3.5 h-3.5" />
              Iniciar Simulado
            </Button>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default SimuladoFiltros;
