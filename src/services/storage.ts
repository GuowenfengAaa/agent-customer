import type { UserSession } from '@/types/domain';

const TOKEN_KEY = 'movie_customer_token';
const SESSION_KEY = 'movie_customer_session';

export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getSession(): UserSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function updateSessionEmail(email: string) {
  const session = getSession();
  if (!session) return;
  saveSession({ ...session, email });
}
