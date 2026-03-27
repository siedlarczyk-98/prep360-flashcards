import { Outlet } from "react-router-dom";
import NavigationRail from "./NavigationRail";
import { useEffect, useState } from "react";
import { fetchPerfil, fetchEspecialidades, salvarEspecialidades } from "@/lib/api";

const AppLayout = () => {
  const [showModal, setShowModal] = useState(false);
  const [especialidades, setEspecialidades] = useState<{ id: number; nome: string }[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const perfil = await fetchPerfil();
      if (!perfil) return;
      const temInteresses = perfil.especialidades && perfil.especialidades.length > 0;
      if (!temInteresses) {
        const lista = await fetchEspecialidades();
        setEspecialidades(lista);
        setShowModal(true);
      }
    };
    verificar();
  }, []);

  const toggleEspecialidade = (nome: string) => {
    setSelecionadas((prev) => (prev.includes(nome) ? prev.filter((e) => e !== nome) : [...prev, nome]));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    await salvarEspecialidades(selecionadas);
    setSalvando(false);
    setShowModal(false);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <NavigationRail />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        <Outlet />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Quais são seus interesses? 🎯</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione as especialidades que você estuda. Isso personaliza sua comparação de desempenho.
            </p>

            <div className="flex flex-wrap gap-2 mb-6 max-h-64 overflow-y-auto">
              {especialidades.map((esp) => {
                const selecionada = selecionadas.includes(esp.nome);
                return (
                  <button
                    key={esp.id}
                    onClick={() => toggleEspecialidade(esp.nome)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selecionada
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {esp.nome}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Pular
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando || selecionadas.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
