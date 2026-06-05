import type { AuthSession, UserRole } from "./session";
import { normalizeRole } from "./roles";

const SESSION_STORAGE_KEY = "kustika.session";
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

export function updateStoredSessionRole(role: UserRole) {
    const session = getStoredSession();

    if (!session) {
        return null;
    }

    const nextSession = {
        ...session,
        user: {
            ...session.user,
            email: session.user?.email ?? "",
            tipo_usuario: normalizeRole(role),
        },
    };

    saveSession(nextSession);
    return nextSession;
}

export function updateStoredSessionPasswordSetup(requiresPasswordSetup: boolean) {
    const session = getStoredSession();

    if (!session) {
        return null;
    }

    const nextSession = {
        ...session,
        user: {
            ...session.user,
            email: session.user?.email ?? "",
            requiresPasswordSetup,
        },
    };

    saveSession(nextSession);
    return nextSession;
}

export function clearSession() {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
}
