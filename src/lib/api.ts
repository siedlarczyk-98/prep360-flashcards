/**
 * CONFIGURAÇÃO BASE
 * Unificada para o novo padrão do backend (/api)
 */
const BASE_URL = "https://prep360.up.railway.app/api";

const JSON_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

/**
 * Resolve o problema de caracteres especiais em e-mails (como o '+')
 */
const getSafeEmail = (email: string) => encodeURIComponent(email);

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
export async function fetchAgendaCompleta(email: string, pagina = 1, limite = 10): Promise<AgendaCompleta> {
  const res = await fetch(`${BASE_URL}/agenda-completa?email=${getSafeEmail(email)}&pagina=${pagina}&limite=${limite}`);
  if (!res.ok) throw new Error("Erro ao buscar agenda completa");
  return res.json();
}

/** Todos os cards liberados para o usuário (usado no Dashboard) */
export async function fetchCards(email: string): Promise<FlashCard[]> {
  const res = await fetch(`${BASE_URL}/cards-pendentes?email=${getSafeEmail(email)}`);
  if (!res.ok) return [];
  return res.json();
}

/** Cards para revisar HOJE (SRS) */
export async function fetchCardsForToday(email: string): Promise<FlashCard[]> {
  const res = await fetch(`${BASE_URL}/cards-para-hoje?email=${getSafeEmail(email)}`);
  if (!res.ok) throw new Error("Erro ao buscar cards para hoje");
  return res.json();
}

/** Estatísticas do Dashboard (rota modular) */
export async function fetchProgressStats(email: string): Promise<ProgressStats> {
  try {
    const res = await fetch(`${BASE_URL}/stats/progresso-srs?email=${getSafeEmail(email)}`, { headers: JSON_HEADERS });
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

export async function fetchResumoSemanal(email: string): Promise<ResumoSemanal> {
  try {
    const res = await fetch(`${BASE_URL}/stats/resumo-7-dias?email=${getSafeEmail(email)}`, { headers: JSON_HEADERS });
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
export async function fetchProgressoDisciplinas(email: string): Promise<ProgressoDisciplina[]> {
  const res = await fetch(`${BASE_URL}/progresso-disciplinas?email=${getSafeEmail(email)}`);
  if (!res.ok) return [];
  return res.json();
}

/** Busca cards filtrados por status (Necessária para o Dashboard funcionar) */
export async function fetchCardsByStatus(email: string, status: DifficultyLevel): Promise<FlashCard[]> {
  let statusParaBanco = status;
  if (status === "dificil") statusParaBanco = "hard";
  if (status === "medio") statusParaBanco = "good";
  if (status === "facil") statusParaBanco = "easy";

  const res = await fetch(`${BASE_URL}/cards-por-status?email=${getSafeEmail(email)}&nivel=${statusParaBanco}`);
  if (!res.ok) return [];
  return res.json();
}

/** Cards que o usuário ainda não começou a estudar */
export async function fetchNewCards(email: string): Promise<FlashCard[]> {
  const res = await fetch(`${BASE_URL}/cards-novos?email=${getSafeEmail(email)}`);
  if (!res.ok) return [];
  return res.json();
}

/** Estudo Manual: busca cards filtrados opcionalmente por aula */
export async function fetchEstudoManual(email: string, aulaId?: string): Promise<FlashCard[]> {
  let url = `${BASE_URL}/estudo-manual?email=${getSafeEmail(email)}`;
  if (aulaId) url += `&aula_id=${encodeURIComponent(aulaId)}`;
  const res = await fetch(url);
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
export async function fetchAulasComQuestoes(email: string): Promise<AulaComQuestoes[]> {
  const res = await fetch(`${BASE_URL}/questoes/aulas-disponiveis?email=${getSafeEmail(email)}`);
  if (!res.ok) return [];
  return res.json();
}

// --- 3. FUNÇÕES DE ENVIO (POST) ---

/** Registra feedback do SRS (again, hard, good, easy) */
export async function registerStudy(email: string, cardId: number, resposta: string) {
  const res = await fetch(`${BASE_URL}/revisar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, card_id: cardId, resposta }),
  });
  if (!res.ok) throw new Error("Erro ao registrar estudo");
  return res.json();
}

// --- 4. QUESTÕES (SIMULADOS) ---

/** Motor de Busca de Questões */
export async function fetchQuestoes(params: {
  email?: string;
  aula_id?: string;
  grande_area?: string;
  instituicao?: string;
  ano?: number;
  apenas_liberadas?: boolean;
  modo?: string;
  limite?: number;
}): Promise<Questao[]> {
  const parts: string[] = [];
  if (params.email) parts.push(`email=${encodeURIComponent(params.email)}`);
  if (params.aula_id) parts.push(`aula_id=${encodeURIComponent(params.aula_id)}`);
  if (params.grande_area) parts.push(`grande_area=${encodeURIComponent(params.grande_area)}`);
  if (params.instituicao) parts.push(`instituicao=${encodeURIComponent(params.instituicao)}`);
  if (params.ano) parts.push(`ano=${params.ano}`);
  if (params.apenas_liberadas) parts.push(`apenas_liberadas=true`);
  if (params.modo) parts.push(`modo=${encodeURIComponent(params.modo)}`);
  if (params.limite) parts.push(`limite=${params.limite}`);

  const queryString = parts.join("&");
  const res = await fetch(`${BASE_URL}/questoes?${queryString}`);
  if (!res.ok) throw new Error("Erro ao buscar questões");
  return res.json();
}

/** Envia a resposta do aluno e recebe o veredito */
export async function responderQuestao(email: string, questao_id: number, escolha: string): Promise<ResultadoResposta> {
  const res = await fetch(`${BASE_URL}/questoes/responder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, questao_id, escolha }),
  });
  if (!res.ok) throw new Error("Erro ao enviar resposta da questão");
  return res.json();
}

/** Estatísticas acumuladas por aula */
export interface EstatisticasAula {
  total_pessoal: number;
  media_acertos_pessoal: number;
  media_global: number;
}

export async function fetchEstatisticasAula(email: string, aulaId: string): Promise<EstatisticasAula | null> {
  try {
    const res = await fetch(`${BASE_URL}/questoes/estatisticas-aula?email=${getSafeEmail(email)}&aula_id=${encodeURIComponent(aulaId)}`);
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

export async function fetchRaioXQuestao(questaoId: number, email: string): Promise<RaioXQuestao | null> {
  try {
    const res = await fetch(`${BASE_URL}/questoes/raio-x/${questaoId}?email=${getSafeEmail(email)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// --- 5. MÉTRICAS ---

export interface AtividadeDiaria {
  data: string;
  flashcards: number;
  questoes: number;
  aulas: number;
}

export async function fetchAtividadeDiaria(email: string): Promise<AtividadeDiaria[]> {
  const res = await fetch(`${BASE_URL}/stats/atividade-diaria?email=${getSafeEmail(email)}`);
  if (!res.ok) return [];
  return res.json();
}

export interface DesempenhoArea {
  grande_area: string;
  percentual: number;
  total: number;
  acertos: number;
}

export async function fetchDesempenhoQuestoes(email: string, tentativa: "primeira" | "ultima"): Promise<DesempenhoArea[]> {
  const res = await fetch(`${BASE_URL}/stats/desempenho-questoes?email=${getSafeEmail(email)}&tentativa=${tentativa}`);
  if (!res.ok) return [];
  return res.json();
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
