import { type FormEvent, useState } from "react";
import { AuthForm, type RegisterFormValues } from "../../features/auth/ui";
import { authApi } from "../../features/auth/api";
import { routes } from "../../app/router/routes";
import heroImage from "../../shared/assets/images/hero/hero.jpg";
import logo from "../../shared/assets/images/logo/logo-combinado.png";
import styles from "../login/login.module.css";

export function RegisterPage() {
    const [pendingEmail, setPendingEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (values: RegisterFormValues) => {
        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            await authApi.register(values);
            setPendingEmail(values.email);
            setMessage("Te enviamos un codigo al correo. Tienes 15 minutos para verificarlo.");
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos crear la cuenta.";
            setError(nextError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const codigo = String(formData.get("codigo") ?? "");

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            await authApi.verifyEmail({ email: pendingEmail, codigo });
            setMessage("Correo verificado. Ya puedes iniciar sesion.");
            window.setTimeout(() => window.location.assign(routes.login), 900);
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos verificar el codigo.";
            setError(nextError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        setError("");
        setMessage("");

        try {
            await authApi.resendCode({ email: pendingEmail });
            setMessage("Te enviamos un codigo nuevo.");
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos reenviar el codigo.";
            setError(nextError);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.shell}>
                <aside className={styles.media}>
                    <img src={heroImage} alt="Experiencia Evenxa" className={styles.mediaImage} />
                    <div className={styles.mediaOverlay} />
                    <div className={styles.mediaContent}>
                        <span className={styles.kicker}>Accesos digitales</span>
                        <h2>Compra boletos con una cuenta lista para crecer.</h2>
                        <p>Este espacio quedo preparado para imagen ahora y video despues.</p>
                    </div>
                </aside>

                <section className={styles.panel}>
                    <div className={styles.copy}>
                        <img src={logo} alt="Evenxa" className={styles.formLogo} />
                        <h1>Crear cuenta</h1>
                        <p>Registrate para comprar boletos y recibir tus accesos digitales.</p>
                    </div>

                    {error && <p className={`${styles.feedback} ${styles.error}`}>{error}</p>}
                    {message && <p className={`${styles.feedback} ${styles.success}`}>{message}</p>}

                    {pendingEmail ? (
                        <form className={styles.verifyForm} onSubmit={handleVerifyEmail}>
                            <label className={styles.verifyField}>
                                <span>Codigo de verificacion</span>
                                <input
                                    name="codigo"
                                    type="text"
                                    inputMode="numeric"
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
                                {isResending ? "Enviando..." : "Reenviar codigo"}
                            </button>
                        </form>
                    ) : (
                        <AuthForm mode="register" onSubmit={handleRegister} isLoading={isLoading} />
                    )}

                    <p className={styles.switch}>
                        Ya tienes cuenta? <a href={routes.login}>Inicia sesion</a>
                    </p>
                </section>
            </section>
        </main>
    );
}
