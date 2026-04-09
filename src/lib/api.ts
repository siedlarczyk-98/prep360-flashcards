const BASE_URL = "https://flashcard-immerso-production.up.railway.app/api";

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

export async function login(email: string): Promise<{ token: string; userId: number; email: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Usuário não encontrado");
  return res.json();
}

export interface FlashCard {
  id: number;
  course_id: number;
  front: string;
  back: string;
  example: string;
  tag_cont: string;
  delta?: string;
  ease?: number;
  course_name?: string;
  tag_area?: string;
}

export interface ProgressStats {
  aprendendo: number;
  revisando: number;
  memorizados: number;
  media_facilidade?: number;
}

export interface ProgressoDisciplina {
  course_id: number;
  total_cards: number;
  cards_estudados: number;
}

export interface AtividadeDiaria {
  dia: string;
  flashcards: number;
}

export interface ResumoSemanal {
  flashcards: number;
}

export async function fetchCardsForToday(): Promise<FlashCard[]> {
  try {
    const res = await authFetch(`${BASE_URL}/cards-para-hoje`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchNewCards(): Promise<FlashCard[]> {
  try {
    const res = await authFetch(`${BASE_URL}/cards-novos`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchProgressoDisciplinas(): Promise<ProgressoDisciplina[]> {
  try {
    const res = await authFetch(`${BASE_URL}/progresso-disciplinas`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchEstudoManual(courseId?: string, tagArea?: string): Promise<FlashCard[]> {
  const params: string[] = [];
  if (courseId) params.push(`course_id=${encodeURIComponent(courseId)}`);
  if (tagArea) params.push(`tag_area=${encodeURIComponent(tagArea)}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  try {
    const res = await authFetch(`${BASE_URL}/estudo-manual${qs}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function registerStudy(cardId: number, resposta: string) {
  const res = await authFetch(`${BASE_URL}/revisar`, {
    method: "POST",
    body: JSON.stringify({ card_id: cardId, resposta }),
  });
  if (!res.ok) throw new Error("Erro ao registrar estudo");
  return res.json();
}

export async function fetchProgressStats(): Promise<ProgressStats> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/progresso-srs`);
    if (!res.ok) return { aprendendo: 0, revisando: 0, memorizados: 0 };
    return res.json();
  } catch {
    return { aprendendo: 0, revisando: 0, memorizados: 0 };
  }
}

export async function fetchResumoSemanal(): Promise<ResumoSemanal> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/resumo-7-dias`);
    if (!res.ok) return { flashcards: 0 };
    return res.json();
  } catch {
    return { flashcards: 0 };
  }
}

export async function fetchAtividadeDiaria(): Promise<AtividadeDiaria[]> {
  try {
    const res = await authFetch(`${BASE_URL}/stats/atividade-diaria`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
