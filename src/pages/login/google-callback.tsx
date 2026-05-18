import { getRoleHomePath, normalizeRole, saveSession, type AuthSession, type SessionUser } from "../../entities/session";
import styles from "./login.module.css";

const getCallbackParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    return new URLSearchParams([...searchParams.entries(), ...hashParams.entries()]);
};

const parseUser = (rawUser: string | null): Partial<SessionUser> => {
    if (!rawUser) {
        return {};
    }

    try {
        const parsedUser = JSON.parse(decodeURIComponent(rawUser));

        if (parsedUser && typeof parsedUser === "object") {
            return parsedUser as Partial<SessionUser>;
        }
    } catch {
        return {};
    }

    return {};
};

const getSessionFromParams = (): AuthSession | null => {
    const params = getCallbackParams();
    const accessToken = params.get("accessToken") ?? params.get("access_token");
    const refreshToken = params.get("refreshToken") ?? params.get("refresh_token");

    if (!accessToken || !refreshToken) {
        return null;
    }

    const user = parseUser(params.get("user"));
    const email = params.get("email") ?? user.email ?? "";
    const role = params.get("tipo_usuario") ?? params.get("role") ?? user.tipo_usuario;

    return {
        accessToken,
        refreshToken,
        user: {
            ...user,
            email,
            nombre: params.get("nombre") ?? user.nombre,
            tipo_usuario: normalizeRole(role),
        },
    };
};

export function GoogleCallbackPage() {
    const session = getSessionFromParams();

    if (session) {
        saveSession(session);
        window.location.replace(getRoleHomePath(session.user?.tipo_usuario));
        return null;
    }

    return (
        <main className={styles.page}>
            <section className={styles.callbackPanel}>
                <h1>No pudimos completar el inicio con Google</h1>
                <p>El backend no regreso los tokens de sesion al frontend.</p>
            </section>
        </main>
    );
}
