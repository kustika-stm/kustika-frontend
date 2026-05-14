import type { AuthSession } from "./session";

const SESSION_STORAGE_KEY = "evenxa.session";
const LEGACY_LOCAL_STORAGE_KEY = "evenxa.session";

export function getStoredSession() {
    const rawSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession) as AuthSession;
    } catch {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}

export function saveSession(session: AuthSession) {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
}
