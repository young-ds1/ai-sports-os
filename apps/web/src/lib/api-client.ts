const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

// Server-side fetch with cache
export async function fetchMatches(date?: string) {
  const params = date ? `?date=${date}` : '';
  return apiFetch<any[]>(`/api/matches${params}`, { cache: 'no-store' });
}

export async function fetchMatch(id: string) {
  return apiFetch<any>(`/api/matches/${id}`, { cache: 'no-store' });
}

export async function fetchTeam(id: string) {
  return apiFetch<any>(`/api/teams/${id}`);
}

export async function fetchPlayer(id: string) {
  return apiFetch<any>(`/api/players/${id}`);
}

export async function fetchAiAnalysis(matchId: string) {
  return apiFetch<any>(`/api/ai/analysis/${matchId}`);
}

export async function fetchAiPrediction(matchId: string) {
  return apiFetch<any>(`/api/ai/predictions/${matchId}`);
}

export async function sendChatMessage(body: {
  sessionId?: string;
  message: string;
  matchId?: string;
}) {
  return apiFetch<any>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
