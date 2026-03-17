import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEstudoManual } from "@/lib/api";
import StudyMode from "@/components/StudyMode";
import { Loader2 } from "lucide-react";

const EstudoManualPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const email = localStorage.getItem("userEmail") || "";
  const aulaId: string | undefined = location.state?.aulaId;

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["estudo-manual", email, aulaId],
    queryFn: () => fetchEstudoManual(email, aulaId),
    enabled: !!email,
  });

  if (!email) return null;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Carregando cards...</span>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-muted-foreground">Nenhum card encontrado para essa aula.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-accent hover:underline">
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <StudyMode
      cards={cards}
      email={email}
      onClose={() => {
        queryClient.invalidateQueries({ queryKey: ["cards-today", email] });
        queryClient.invalidateQueries({ queryKey: ["cards-new", email] });
        queryClient.invalidateQueries({ queryKey: ["progress-stats", email] });
        queryClient.invalidateQueries({ queryKey: ["cards", email] });
        navigate("/dashboard");
      }}
    />
  );
};

export default EstudoManualPage;
