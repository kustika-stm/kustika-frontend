import { useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import {
    getRoleHomePath,
    getTokenRole,
    normalizeRole,
    saveSession,
    updateStoredSessionPasswordSetup,
    type AuthSession,
    type SessionUser,
} from "../../entities/session";
import { authApi } from "../../features/auth/api";
import arrowIcon from "../../shared/assets/icons/flecha.png";
import styles from "./login.module.css";

const getCallbackParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    return new URLSearchParams([...searchParams.entries(), ...hashParams.entries()]);
};

const getBooleanParam = (value: string | null) => value?.toLowerCase() === "true";

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
    const requiresPasswordSetup = getBooleanParam(params.get("requiresPasswordSetup") ?? params.get("requires_password_setup"));
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
            requiresPasswordSetup,
        },
    };
};

const validatePassword = (password: string) => {
    if (password.length < 8) {
        return "La contrasena debe tener al menos 8 caracteres.";
    }

    if (password.length > 32) {
        return "La contrasena debe tener maximo 32 caracteres.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Agrega al menos una mayuscula.";
    }

    if (!/\d/.test(password)) {
        return "Agrega al menos un numero.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Agrega al menos un caracter especial.";
    }

    return "";
};

type PasswordSetupProps = {
    session: AuthSession;
};

function GooglePasswordSetup({ session }: PasswordSetupProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const finishLogin = () => {
        window.location.replace(getRoleHomePath(session.user?.tipo_usuario));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationMessage = validatePassword(password);

        if (validationMessage) {
            setFeedback(validationMessage);
            return;
        }

        if (password !== confirmPassword) {
            setFeedback("Las contrasenas no coinciden.");
            return;
        }

        setIsSubmitting(true);
        setFeedback("");

        try {
            await authApi.createGooglePassword(session.accessToken, { password });
            updateStoredSessionPasswordSetup(false);
            finishLogin();
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : "No pudimos crear tu contrasena.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.callbackPanel}>
                <a className={styles.homeLink} href={routes.home}>
                    <img src={arrowIcon} alt="" aria-hidden="true" />
                    Volver al inicio
                </a>
                <span className={styles.kicker}>Cuenta Google</span>
                <h1>Crea una contrasena</h1>
                <p>Tu cuenta ya esta lista. Agrega una contrasena para tambien poder entrar con email.</p>

                {feedback && <p className={`${styles.feedback} ${styles.error}`}>{feedback}</p>}

                <form className={styles.verifyForm} onSubmit={handleSubmit}>
                    <label className={styles.verifyField}>
                        <span>Contrasena</span>
                        <input
                            type="password"
                            minLength={8}
                            maxLength={32}
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>

                    <label className={styles.verifyField}>
                        <span>Confirmar contrasena</span>
                        <input
                            type="password"
                            minLength={8}
                            maxLength={32}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />
                    </label>

                    <p className={styles.passwordRules}>
                        Usa 8 a 32 caracteres, una mayuscula, un numero y un caracter especial.
                    </p>

                    <button className={styles.verifySubmit} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Crear contrasena"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export function GoogleCallbackPage() {
    const [session] = useState(() => getSessionFromParams());

    if (session) {
        window.history.replaceState(null, "", routes.googleCallback);
        saveSession(session);

        if (session.user?.requiresPasswordSetup) {
            return <GooglePasswordSetup session={session} />;
        }

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
