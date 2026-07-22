import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Questao } from "@/lib/api";

interface SimuladoQuestionMapProps {
  questoes: Questao[];
  indiceAtual: number;
  respostas: Record<string, string>;
  marcadas: number[];
  onSelect: (index: number) => void;
}

const PAGE_SIZE = 50;

export function SimuladoQuestionMap({ questoes, indiceAtual, respostas, marcadas, onSelect }: SimuladoQuestionMapProps) {
  const currentPage = Math.floor(indiceAtual / PAGE_SIZE);
  const [page, setPage] = useState(currentPage);
  const pages = Math.max(1, Math.ceil(questoes.length / PAGE_SIZE));
  useEffect(() => setPage(currentPage), [currentPage]);

  const visible = useMemo(() => {
    const start = page * PAGE_SIZE;
    return questoes.slice(start, start + PAGE_SIZE).map((questao, offset) => ({ questao, index: start + offset }));
  }, [page, questoes]);
  const respondidas = Object.keys(respostas).length;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <h2 className="text-sm font-bold">Mapa da prova</h2>
        <p className="mt-1 text-xs text-muted-foreground">{respondidas} respondidas · {questoes.length - respondidas} em branco</p>
      </div>
      <div className="my-3 grid shrink-0 grid-cols-5 content-start gap-1.5 overflow-hidden sm:grid-cols-10 xl:grid-cols-5">
        {visible.map(({ questao, index }) => {
          const answered = !!respostas[String(questao.id)];
          const marked = marcadas.includes(questao.id);
          return (
            <button key={questao.id} aria-label={`Questão ${index + 1}${answered ? " respondida" : " em branco"}${marked ? " marcada para revisão" : ""}`} onClick={() => onSelect(index)} className={`relative h-8 rounded-lg border text-xs font-bold transition-colors ${index === indiceAtual ? "ring-2 ring-inset ring-primary" : ""} ${answered ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}>
              {index + 1}
              {marked && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />}
            </button>
          );
        })}
      </div>
      <div className="mt-auto shrink-0 space-y-2 border-t pt-2.5">
        {pages > 1 && <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior do mapa"><ArrowLeft className="h-3.5 w-3.5" /></Button>
          <span className="text-[11px] font-medium tabular-nums">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, questoes.length)} de {questoes.length}</span>
          <Button variant="outline" size="sm" disabled={page === pages - 1} onClick={() => setPage((value) => value + 1)} aria-label="Próxima página do mapa"><ArrowRight className="h-3.5 w-3.5" /></Button>
        </div>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground xl:block xl:space-y-1">
          <p><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-primary" />Respondida</p>
          <p><span className="mr-1 inline-block h-2 w-2 rounded-sm border" />Em branco</p>
          <p><span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" />Revisar</p>
        </div>
      </div>
    </div>
  );
}
