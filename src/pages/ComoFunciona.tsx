import { useState } from "react";
import { Brain, Lightbulb, ArrowLeft, Timer, TrendingUp, Zap, ChevronLeft, ChevronRight, Eye, FlameKindling, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const memoryData = [
  { day: 0, sem: 100, r1: 100, r2: 100, r3: 100 },
  { day: 1, sem: 40, r1: 100, r2: 100, r3: 100 },
  { day: 2, sem: 30, r1: 70, r2: 100, r3: 100 },
  { day: 4, sem: 22, r1: 55, r2: 80, r3: 100 },
  { day: 7, sem: 18, r1: 45, r2: 65, r3: 90 },
  { day: 14, sem: 12, r1: 35, r2: 55, r3: 82 },
  { day: 21, sem: 8, r1: 28, r2: 48, r3: 78 },
  { day: 30, sem: 5, r1: 22, r2: 42, r3: 75 },
];

const pages = [
  // Page 0 — Hero
  () => (
    <div className="flex flex-col items-center justify-center text-center gap-4 h-full px-4">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <Brain className="w-7 h-7 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">A Ciência por Trás da Repetição Espaçada</h1>
      <p className="text-muted-foreground max-w-md leading-relaxed text-sm">
        Nosso método combina décadas de pesquisa em neurociência e psicologia cognitiva para transformar a forma como você memoriza.
      </p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <ChevronRight className="w-3.5 h-3.5" />
        <span>Deslize para aprender mais</span>
      </div>
    </div>
  ),

  // Page 1 — Dashboard Curva do Esquecimento (único slide de conteúdo)
  () => (
    <div className="flex flex-col gap-3 h-full px-1 overflow-y-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <Timer className="w-4.5 h-4.5 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">A Curva do Esquecimento</h2>
          <p className="text-[11px] text-muted-foreground">Ebbinghaus (1885): sem revisão, perdemos até 70% em 24h.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left column: Gráfico + Passivo vs Ativo */}
        <div className="flex flex-col gap-4">
          {/* Card 1 — Gráfico da Memória */}
          <div className="flex-1 rounded-xl bg-card border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-destructive" />
              O Gráfico da Memória
            </p>
            <div className="h-36 md:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memoryData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Dias", position: "insideBottomRight", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} label={{ value: "%", position: "insideTopLeft", offset: 4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="sem" name="Sem revisão" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                  <Line type="monotone" dataKey="r1" name="1ª revisão" stroke="hsl(var(--warning))" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="r2" name="2ª revisão" stroke="hsl(var(--brand-blue))" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="r3" name="3ª revisão" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
              A linha pontilhada mostra o esquecimento natural. Cada revisão (linhas coloridas) não apenas recupera a memória para 100%, mas <strong className="text-foreground">achata a curva</strong>, fazendo com que a informação demore muito mais para ser esquecida novamente.
            </p>
          </div>

          {/* Card 3 — Estudo Passivo vs Ativo */}
          <div className="flex-1 rounded-xl bg-card border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              Passivo vs. Ativo
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/40 border border-border text-center">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Passivo</p>
                <p className="text-[10px] text-muted-foreground leading-snug">Ler PDFs, assistir vídeos</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-muted-foreground/40 h-1.5 rounded-full" style={{ width: "25%" }} />
                </div>
                <p className="text-[10px] text-muted-foreground">~25% retenção</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-accent/5 border border-accent/20 text-center">
                <FlameKindling className="w-5 h-5 text-accent" />
                <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Ativo</p>
                <p className="text-[10px] text-muted-foreground leading-snug">Forçar o recall com flashcards</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-accent h-1.5 rounded-full" style={{ width: "90%" }} />
                </div>
                <p className="text-[10px] text-accent font-semibold">~90% retenção</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-3">
              Reler resumos é confortável, mas ineficiente. O cérebro só constrói conexões neurais fortes quando é <strong className="text-foreground">forçado a recuperar uma informação do zero</strong>. Cada flashcard é um exercício de musculação para a sua memória.
            </p>
          </div>
        </div>

        {/* Right column: Algoritmo + Dicas */}
        <div className="flex flex-col gap-4">
          {/* Card 2 — Os 4 Botões */}
          <div className="flex-1 rounded-xl bg-card border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
              Como o Algoritmo Funciona
            </p>
            <div className="space-y-1.5">
              {[
                { icon: "🔴", title: "Errei", desc: "Volta para a estaca zero para você rever hoje." },
                { icon: "🟠", title: "Difícil", desc: "Aumenta o intervalo de revisão em apenas 20%." },
                { icon: "🟢", title: "Médio", desc: "O salto padrão! Multiplica o tempo de revisão." },
                { icon: "🔵", title: "Fácil", desc: "Joga o card lá para frente — você dominou!" },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                  <span className="text-sm mt-0.5">{b.icon}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4 — Dicas de Ouro */}
          <div className="flex-1 rounded-xl bg-card border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />
              Dicas de Ouro
            </p>
            <div className="space-y-1.5">
              {[
                { icon: "📅", title: "Não pule dias", desc: "10 min/dia vencem 2h no fim de semana." },
                { icon: "🎯", title: "Seja honesto", desc: "\"Fácil\" sem saber prejudica o algoritmo." },
                { icon: "🧘", title: "Confie no processo", desc: "Após 2 semanas a retenção explode." },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                  <span className="text-sm">{tip.icon}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{tip.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
];

const ComoFunciona = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = pages.length;

  const go = (next: number) => {
    setDirection(next > page ? 1 : -1);
    setPage(next);
  };

  const PageContent = pages[page];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="font-semibold text-foreground text-sm">Como Funciona</span>
          </div>
          <span className="text-xs text-muted-foreground w-16 text-right">{page + 1}/{total}</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto px-4 py-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full"
          >
            <PageContent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="shrink-0 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => go(page - 1)}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === page ? "bg-primary w-5" : "bg-border hover:bg-muted-foreground/40"}`}
              />
            ))}
          </div>

          {page < total - 1 ? (
            <button
              onClick={() => go(page + 1)}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Estudar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComoFunciona;
