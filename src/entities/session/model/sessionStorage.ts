import type { AuthSession } from "./session";

const SESSION_STORAGE_KEY = "evenxa.session";

export function getStoredSession() {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession) as AuthSession;
    } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}

export function saveSession(session: AuthSession) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
