import { type FormEvent, useState } from "react";
import { AuthForm, type RegisterFormValues } from "../../features/auth/ui";
import { authApi } from "../../features/auth/api";
import { getRoleHomePath, saveSession } from "../../entities/session";
import { routes } from "../../app/router/routes";
import arrowIcon from "../../shared/assets/icons/flecha.png";
import heroImage from "../../shared/assets/images/hero/hero.jpg";
import { kustikaWordmark } from "../../shared/assets/images/logo";
import { useAlerts } from "../../shared/ui/alerts";
import styles from "../login/login.module.css";

export function RegisterPage() {
    const alerts = useAlerts();
    const [pendingEmail, setPendingEmail] = useState("");
    const [pendingPassword, setPendingPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleRegister = async (values: RegisterFormValues) => {
        setIsLoading(true);

        try {
            await authApi.register(values);
            setPendingEmail(values.email);
            setPendingPassword(values.password);
            alerts.notify({
                tone: "success",
                title: "Código enviado",
                message: "Te enviamos un código al correo. Tienes 15 minutos para verificarlo.",
            });
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos crear la cuenta.";

            alerts.notify({ tone: "error", title: "No pudimos crear la cuenta", message: nextError });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const codigo = String(formData.get("codigo") ?? "");

        setIsLoading(true);

        try {
            await authApi.verifyEmail({ email: pendingEmail, codigo });

            try {
                const session = await authApi.login({ email: pendingEmail, password: pendingPassword });
                saveSession(session);

                alerts.notify({
                    tone: "success",
                    title: "Cuenta lista",
                    message: "Verificamos tu correo e iniciamos tu sesión.",
                });
                window.setTimeout(() => window.location.assign(getRoleHomePath(session.user?.tipo_usuario)), 900);
            } catch (loginError) {
                const message = loginError instanceof Error ? loginError.message : "No pudimos iniciar sesión automáticamente.";

                alerts.notify({
                    tone: "error",
                    title: "Correo verificado",
                    message: `${message} Inténtalo desde el inicio de sesión.`,
                });
                window.setTimeout(() => window.location.assign(routes.login), 1400);
            }
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos verificar el código.";

            alerts.notify({ tone: "error", title: "No pudimos verificar el código", message: nextError });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);

        try {
            await authApi.resendCode({ email: pendingEmail });
            alerts.notify({ tone: "success", title: "Código reenviado", message: "Te enviamos un código nuevo." });
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos reenviar el código.";

            alerts.notify({ tone: "error", title: "No pudimos reenviar el código", message: nextError });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.shell}>
                <aside className={styles.media}>
                    <img src={heroImage} alt="Experiencia Kustika" className={styles.mediaImage} />
                    <div className={styles.mediaOverlay} />
                    <div className={styles.mediaContent}>
                        <span className={styles.kicker}>Accesos digitales</span>
                        <h2>Compra boletos con una cuenta lista para crecer.</h2>
                        <p>Este espacio quedó preparado para imagen ahora y video después.</p>
                    </div>
                </aside>

                <section className={styles.panel}>
                    <div className={styles.copy}>
                        <div className={styles.formTopbar}>
                            <img src={kustikaWordmark} alt="Kustika" className={styles.formLogo} />
                            <a className={styles.homeLink} href={routes.home}>
                                <img src={arrowIcon} alt="" aria-hidden="true" />
                                Volver al inicio
                            </a>
                        </div>
                        <h1>Crear cuenta</h1>
                        <p>Regístrate para comprar boletos y recibir tus accesos digitales.</p>
                    </div>

                    {pendingEmail ? (
                        <form className={styles.verifyForm} onSubmit={handleVerifyEmail}>
                            <label className={styles.verifyField}>
                                <span>Código de verificación</span>
                                <input
                                    name="codigo"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    minLength={6}
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    placeholder="123456"
                                    required
                                />
                            </label>

                            <button className={styles.verifySubmit} type="submit" disabled={isLoading}>
                                {isLoading ? "Verificando..." : "Verificar correo"}
                            </button>

                            <button
                                className={styles.secondaryButton}
                                type="button"
                                disabled={isResending}
                                onClick={handleResendCode}
                            >
                                {isResending ? "Enviando..." : "Reenviar código"}
                            </button>
                        </form>
                    ) : (
                        <AuthForm mode="register" onSubmit={handleRegister} isLoading={isLoading} />
                    )}

                    <p className={styles.switch}>
                        ¿Ya tienes cuenta? <a href={routes.login}>Inicia sesión</a>
                    </p>
                </section>
            </section>
        </main>
    );
}
