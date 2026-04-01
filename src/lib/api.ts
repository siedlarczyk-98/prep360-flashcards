/**
 * CONFIGURAÇÃO BASE
 * Unificada para o novo padrão do backend (/api)
 */
const BASE_URL = "https://prep360.up.railway.app/api";

/**
 * Wrapper autenticado para fetch.
 * Injeta Authorization: Bearer <token> e trata 401/403 (sessão expirada).
 * O backend identifica o usuário pelo JWT — não enviar email na URL/body.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("userToken");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userEmail");
    window.location.href = "/";
    throw new Error("Sessão expirada");
  }

  return res;
}

/** Login: identifica usuário e retorna JWT */
export async function identificarUsuario(email: string): Promise<{ token: string }> {
  const res = await fetch(`${BASE_URL}/auth/identificar-usuario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Erro ao identificar usuário");
  return res.json();
}

// --- 1. INTERFACES (DEFINIÇÕES DE DADOS) ---

export interface FlashCard {
  id: number;
  aula_id: string;
  frente: string;
  verso: string;
  exemplo: string;
  tags: string;
}

export interface EventoFixo {
  id: number;
  tipo: "aula" | "simulado";
  titulo: string;
  aula_nome?: string;
  data_inicio: string;
  data_fim?: string;
  link_acesso?: string;
}

export interface RevisaoSRS {
  data: string;
  qtd: number;
  aula_nome: string;
}

export interface AgendaCompleta {
  eventos_fixos: EventoFixo[];
  revisoes_srs: RevisaoSRS[];
}

export interface ProgressStats {
  aprendendo: number;
  revisando: number;
  memorizados: number;
  media_facilidade?: string;
}

export interface ProgressoDisciplina {
  aula_id: string;
  total_cards: number;
  cards_estudados: number;
  progresso_percentual: number;
}

export interface Questao {
  id: number;
  aula_id: string;
  aula_nome: string;
  grande_area: string;
  enunciado: string;
  img_url?: string;
  alternativas: Record<string, string>;
  instituicao?: string;
  ano?: number;
  dificuldade?: string;
  tags?: string;
}

export interface ResultadoResposta {
  acertou: boolean;
  gabarito_correto: string;
  feedback_prof: string;
  percentual_global_acerto?: number;
}

export type DifficultyLevel = "again" | "hard" | "good" | "easy" | "dificil" | "medio" | "facil";

// --- 2. FUNÇÕES DE BUSCA (GET) ---

/** Agenda unificada: Aulas, Simulados e Flashcards por tema */
export async function fetchAgendaCompleta(pagina = 1, limite = 10): Promise<AgendaCompleta> {
  const res = await authFetch(`${BASE_URL}/agenda-completa?pagina=${pagina}&limite=${limite}`);
  if (!res.ok) throw new Error("Erro ao buscar agenda completa");
  return res.json();
}

/** Cards para revisar HOJE (SRS) — também usado como lista geral */
export async function fetchCards(): Promise<FlashCard[]> {
  const res = await authFetch(`${BASE_URL}/cards-para-hoje`);
  if (!res.ok) return [];
  return res.json();
}

/** Cards para revisar HOJE (SRS) */
export async function fetchCardsForToday(): Promise<FlashCard[]> {
  const res = await authFetch(`${BASE_URL}/cards-para-hoje`);
  if (!res.ok) throw new Error("Erro ao buscar cards para hoje");
  return res.json();
}

/** Estatísticas do Dashboard (rota modular) */
export async function fetchProgressStats(): Promise<ProgressStats> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/progresso-srs`);
    if (!res.ok) {
      console.error(`[fetchProgressStats] HTTP ${res.status}: ${res.statusText}`);
      return { aprendendo: 0, revisando: 0, memorizados: 0 };
    }
    return res.json();
  } catch (err) {
    console.error("[fetchProgressStats] Network error:", err);
    throw err;
  }
}

/** Resumo semanal: flashcards feitos + questões respondidas nos últimos 7 dias */
export interface ResumoSemanal {
  flashcards: number;
  questoes: number;
}

export async function fetchResumoSemanal(): Promise<ResumoSemanal> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/resumo-7-dias`);
    if (!res.ok) {
      console.error(`[fetchResumoSemanal] HTTP ${res.status}: ${res.statusText}`);
      return { flashcards: 0, questoes: 0 };
    }
    return res.json();
  } catch (err) {
    console.error("[fetchResumoSemanal] Network error:", err);
    throw err;
  }
}

/** Progresso por matéria */
export async function fetchProgressoDisciplinas(): Promise<ProgressoDisciplina[]> {
  const res = await authFetch(`${BASE_URL}/progresso-disciplinas`);
  if (!res.ok) return [];
  return res.json();
}

/** Busca cards filtrados por status */
export async function fetchCardsByStatus(status: DifficultyLevel): Promise<FlashCard[]> {
  let statusParaBanco: string = status;
  if (status === "dificil") statusParaBanco = "hard";
  if (status === "medio") statusParaBanco = "good";
  if (status === "facil") statusParaBanco = "easy";

  const res = await authFetch(`${BASE_URL}/cards-por-status?nivel=${statusParaBanco}`);
  if (!res.ok) return [];
  return res.json();
}

/** Cards que o usuário ainda não começou a estudar */
export async function fetchNewCards(): Promise<FlashCard[]> {
  const res = await authFetch(`${BASE_URL}/cards-novos`);
  if (!res.ok) return [];
  return res.json();
}

/** Estudo Manual: busca cards filtrados opcionalmente por aula */
export async function fetchEstudoManual(aulaId?: string): Promise<FlashCard[]> {
  let url = `${BASE_URL}/estudo-manual`;
  if (aulaId) url += `?aula_id=${encodeURIComponent(aulaId)}`;
  const res = await authFetch(url);
  if (!res.ok) return [];
  return res.json();
}

// --- 2.5 AULAS COM QUESTÕES DISPONÍVEIS ---

export interface AulaComQuestoes {
  aula_id: string;
  aula_nome: string;
  total_questoes: number;
}

/** Busca aulas que possuem questões disponíveis para o aluno */
export async function fetchAulasComQuestoes(): Promise<AulaComQuestoes[]> {
  const res = await authFetch(`${BASE_URL}/questoes/aulas-disponiveis`);
  if (!res.ok) return [];
  return res.json();
}

/** Lista de instituições disponíveis para o modo simulado */
export async function fetchInstituicoes(): Promise<string[]> {
  try {
    const res = await authFetch(`${BASE_URL}/questoes/instituicoes`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// --- 3. FUNÇÕES DE ENVIO (POST) ---

/** Registra feedback do SRS (again, hard, good, easy) */
export async function registerStudy(cardId: number, resposta: string) {
  const res = await authFetch(`${BASE_URL}/revisar`, {
    method: "POST",
    body: JSON.stringify({ card_id: cardId, resposta }),
  });
  if (!res.ok) throw new Error("Erro ao registrar estudo");
  return res.json();
}

// --- 4. QUESTÕES (SIMULADOS) ---

/** Motor de Busca de Questões */
export async function fetchQuestoes(params: {
  aula_id?: string;
  grande_area?: string;
  instituicao?: string;
  ano?: number;
  apenas_liberadas?: boolean;
  modo?: string;
  limite?: number;
}): Promise<Questao[]> {
  const parts: string[] = [];
  if (params.aula_id) parts.push(`aula_id=${encodeURIComponent(params.aula_id)}`);
  if (params.grande_area) parts.push(`grande_area=${encodeURIComponent(params.grande_area)}`);
  if (params.instituicao) parts.push(`instituicao=${encodeURIComponent(params.instituicao)}`);
  if (params.ano) parts.push(`ano=${params.ano}`);
  if (params.apenas_liberadas) parts.push(`apenas_liberadas=true`);
  if (params.modo) parts.push(`modo=${encodeURIComponent(params.modo)}`);
  if (params.limite) parts.push(`limite=${params.limite}`);

  const queryString = parts.length > 0 ? `?${parts.join("&")}` : "";
  const res = await authFetch(`${BASE_URL}/questoes${queryString}`);
  if (!res.ok) throw new Error("Erro ao buscar questões");
  return res.json();
}

/** Envia a resposta do aluno e recebe o veredito */
export async function responderQuestao(questao_id: number, escolha: string): Promise<ResultadoResposta> {
  const res = await authFetch(`${BASE_URL}/questoes/responder`, {
    method: "POST",
    body: JSON.stringify({ questao_id, escolha }),
  });
  if (!res.ok) throw new Error("Erro ao enviar resposta da questão");
  return res.json();
}

/** Envia feedback sobre o comentário do professor */
export async function enviarFeedbackProf(questao_id: number, util: boolean): Promise<{ success: boolean }> {
  const res = await authFetch(`${BASE_URL}/questoes/feedback-prof`, {
    method: "POST",
    body: JSON.stringify({ questao_id, util }),
  });
  if (!res.ok) throw new Error("Erro ao enviar feedback");
  return res.json();
}

/** Estatísticas acumuladas por aula */
export interface EstatisticasAula {
  total_pessoal: number;
  media_acertos_pessoal: number;
  media_global: number;
}

export async function fetchEstatisticasAula(aulaId: string): Promise<EstatisticasAula | null> {
  try {
    const res = await authFetch(`${BASE_URL}/questoes/estatisticas-aula?aula_id=${encodeURIComponent(aulaId)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Raio-X individual de uma questão */
export interface RaioXQuestao {
  vezes_treinada: number;
  vezes_acertou: number;
  media_global_acerto: number;
}

export async function fetchRaioXQuestao(questaoId: number): Promise<RaioXQuestao | null> {
  try {
    const res = await authFetch(`${BASE_URL}/questoes/raio-x/${questaoId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// --- 5. MÉTRICAS ---

export interface AtividadeDiariaRaw {
  dia: string;
  flashcards: number;
  questoes: number;
  aulas: number;
  volume: number;
}

export interface AtividadeDiaria {
  data: string;
  flashcards: number;
  questoes: number;
  aulas: number;
}

export async function fetchAtividadeDiaria(): Promise<AtividadeDiaria[]> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/atividade-diaria`);
    if (!res.ok) {
      console.error(`[fetchAtividadeDiaria] HTTP ${res.status}: ${res.statusText}`);
      return [];
    }
    const raw: AtividadeDiariaRaw[] = await res.json();
    return raw.map((r) => ({
      data: r.dia.split("T")[0],
      flashcards: r.flashcards,
      questoes: r.questoes,
      aulas: r.aulas,
    }));
  } catch (err) {
    console.error("[fetchAtividadeDiaria] Network error:", err);
    throw err;
  }
}

export interface DesempenhoArea {
  grande_area: string;
  percentual: number;
  total: number;
  acertos: number;
}

export async function fetchDesempenhoQuestoes(tentativa: "primeira" | "ultima"): Promise<DesempenhoArea[]> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/desempenho-questoes?tentativa=${tentativa}`);
    if (!res.ok) {
      console.error(`[fetchDesempenhoQuestoes] HTTP ${res.status}: ${res.statusText}`);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("[fetchDesempenhoQuestoes] Network error:", err);
    throw err;
  }
}

export interface DesempenhoComparativo {
  grande_area: string;
  total: number;
  corretas: number;
  percentual: number;
  percentual_grupo: number | null;
  grupo: string;
}

export interface ResultadoComparativo {
  resultado: DesempenhoComparativo[];
  grupo: "interesse" | "geral";
  especialidades: string[];
}

export async function fetchDesempenhoComparativo(
  tentativa: "primeira" | "ultima",
): Promise<ResultadoComparativo | null> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/desempenho-comparativo?tentativa=${tentativa}`);
    console.log("[comparativo] status:", res.status);
    if (!res.ok) return null;
    const data = await res.json();
    console.log("[comparativo] data:", data);
    return data;
  } catch (err) {
    console.error("[comparativo] erro:", err);
    return null;
  }
}

// --- 6. INTEGRAÇÃO ANKI ---

export async function syncWithAnki(cards: FlashCard[]) {
  const ankiRequest = async (action: string, params: any) => {
    const res = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      body: JSON.stringify({ action, version: 6, params }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  try {
    await ankiRequest("createDeck", { deck: "Paciente360" });

    const notes = cards.map((card) => ({
      deckName: "Paciente360",
      modelName: "Basic",
      fields: {
        Front: card.frente,
        Back: card.verso + (card.exemplo ? `\n\n<i>${card.exemplo}</i>` : ""),
      },
      tags: card.tags ? card.tags.split(",").map((t) => t.trim()) : [],
    }));

    await ankiRequest("addNotes", { notes });
    return { success: true, count: cards.length };
  } catch {
    throw new Error("ANKI_NOT_CONNECTED");
  }
}

// --- 7. ONBOARDING WEB ---

export async function fetchOnboardingWeb(): Promise<boolean> {
  try {
    const res = await authFetch(`${BASE_URL}/perfil`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.onboarding_web ?? false;
  } catch {
    return false;
  }
}

export async function marcarOnboardingWeb(): Promise<void> {
  try {
    await authFetch(`${BASE_URL}/perfil/onboarding-web`, { method: "PATCH" });
  } catch {
    console.error("Erro ao marcar onboarding web");
  }
}

// --- 8. PERFIL ---

export interface Perfil {
  nome: string;
  especialidades: string[];
  onboarding_web: boolean;
}

export async function fetchPerfil(): Promise<Perfil | null> {
  try {
    const res = await authFetch(`${BASE_URL}/perfil`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchEspecialidades(): Promise<{ id: number; nome: string }[]> {
  try {
    const res = await authFetch(`${BASE_URL}/perfil/especialidades`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function salvarEspecialidades(especialidades: string[]): Promise<void> {
  try {
    const perfil = await fetchPerfil();
    await authFetch(`${BASE_URL}/perfil`, {
      method: "POST",
      body: JSON.stringify({
        nome: perfil?.nome || "",
        ano_ingresso: null,
        quer_residencia: false,
        especialidades,
      }),
    });
  } catch {
    console.error("Erro ao salvar especialidades");
  }
}
