import { routes } from "../../app/router/routes";
import { getRoleHomePath, getTokenRole, normalizeRole, saveSession, type AuthSession, type SessionUser } from "../../entities/session";
import arrowIcon from "../../shared/assets/icons/flecha.png";
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
    const role = params.get("tipo_usuario") ?? params.get("role") ?? user.tipo_usuario ?? getTokenRole(accessToken);
    const photoUrl =
        params.get("foto_url") ??
        params.get("avatar_url") ??
        params.get("photo_url") ??
        params.get("picture") ??
        user.foto_url ??
        user.avatar_url ??
        user.photo_url ??
        user.picture;

    return {
        accessToken,
        refreshToken,
        user: {
            ...user,
            email,
            nombre: params.get("nombre") ?? user.nombre,
            foto_url: photoUrl,
            avatar_url: user.avatar_url,
            photo_url: user.photo_url,
            picture: user.picture,
            tipo_usuario: normalizeRole(role),
        },
    };
};

export function GoogleCallbackPage() {
    const session = getSessionFromParams();

    if (session) {
        window.history.replaceState(null, "", routes.googleCallback);
        saveSession(session);
        window.location.replace(getRoleHomePath(session.user?.tipo_usuario));
        return null;
    }

    return (
        <main className={styles.page}>
            <section className={styles.callbackPanel}>
                <a className={styles.homeLink} href={routes.home}>
                    <img src={arrowIcon} alt="" aria-hidden="true" />
                    Volver al inicio
                </a>
                <h1>No pudimos completar el inicio con Google</h1>
                <p>El backend no regreso los tokens de sesion al frontend.</p>
            </section>
        </main>
    );
}
