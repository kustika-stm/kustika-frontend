import { useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import { authApi } from "../../features/auth/api";
import arrowIcon from "../../shared/assets/icons/flecha.png";
import heroImage from "../../shared/assets/images/hero/hero.jpg";
import logo from "../../shared/assets/images/logo/logo-combinado.png";
import styles from "../login/login.module.css";

type RecoveryStep = "email" | "code" | "password" | "done";

export function RecoverPasswordPage() {
    const [step, setStep] = useState<RecoveryStep>("email");
    const [email, setEmail] = useState("");
    const [codigo, setCodigo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const formData = new FormData(event.currentTarget);
        const nextEmail = String(formData.get("email") ?? "").trim();

        setIsLoading(true);

        try {
            await authApi.recoverPassword({ email: nextEmail });
            setEmail(nextEmail);
            setStep("code");
            setMessage("Te enviamos un codigo de recuperacion a tu correo.");
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos enviar el codigo.";
            setError(nextError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const formData = new FormData(event.currentTarget);
        const nextCodigo = String(formData.get("codigo") ?? "").trim();

        setIsLoading(true);

        try {
            await authApi.verifyResetCode({ email, codigo: nextCodigo });
            setCodigo(nextCodigo);
            setStep("password");
            setMessage("Codigo verificado. Ahora crea tu nueva contrasena.");
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "El codigo no es valido.";
            setError(nextError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError("");
        setMessage("");
        setIsLoading(true);

        try {
            await authApi.recoverPassword({ email });
            setMessage("Te reenviamos el codigo de recuperacion.");
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos reenviar el codigo.";
            setError(nextError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const formData = new FormData(event.currentTarget);
        const nuevaPassword = String(formData.get("nueva_password") ?? "");
        const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

        if (nuevaPassword.length < 8) {
            setError("La contrasena debe tener al menos 8 caracteres.");
            return;
        }

        if (nuevaPassword !== passwordConfirm) {
            setError("Las contrasenas no coinciden.");
            return;
        }

        setIsLoading(true);

        try {
            await authApi.resetPassword({
                email,
                codigo,
                nueva_password: nuevaPassword,
            });
            setStep("done");
            setMessage("Contrasena actualizada. Ya puedes iniciar sesion.");
        } catch (requestError) {
            const nextError = requestError instanceof Error ? requestError.message : "No pudimos cambiar tu contrasena.";
            setError(nextError);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            {isLoading && (
                <div className={styles.loadingOverlay} role="status" aria-live="polite" aria-label="Procesando solicitud">
                    <div className={styles.loadingDialog}>
                        <span className={styles.spinner} aria-hidden="true" />
                        <strong>Procesando</strong>
                        <p>Estamos validando tu solicitud.</p>
                    </div>
                </div>
            )}

            <section className={styles.shell}>
                <aside className={styles.media}>
                    <img src={heroImage} alt="Concierto Evenxa" className={styles.mediaImage} />
                    <div className={styles.mediaOverlay} />
                    <div className={styles.mediaContent}>
                        <span className={styles.kicker}>Acceso seguro</span>
                        <h2>Vuelve a entrar a tu cuenta.</h2>
                        <p>Recupera tu acceso y continua guardando eventos, boletos y compras.</p>
                    </div>
                </aside>

                <section className={styles.panel}>
                    <div className={styles.copy}>
                        <div className={styles.formTopbar}>
                            <img src={logo} alt="Evenxa" className={styles.formLogo} />
                            <a className={styles.homeLink} href={routes.home}>
                                <img src={arrowIcon} alt="" aria-hidden="true" />
                                Volver al inicio
                            </a>
                        </div>
                        <h1>Recuperar contrasena</h1>
                        <p>Completa los pasos para crear una nueva contrasena.</p>
                    </div>

                    {error && <p className={`${styles.feedback} ${styles.error}`}>{error}</p>}
                    {message && <p className={`${styles.feedback} ${styles.success}`}>{message}</p>}

                    {step === "email" && (
                        <form className={styles.verifyForm} onSubmit={handleRequestCode}>
                            <label className={styles.verifyField}>
                                <span>Correo electronico</span>
                                <input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
                            </label>
                            <button className={styles.verifySubmit} type="submit" disabled={isLoading}>
                                Enviar codigo
                            </button>
                        </form>
                    )}

                    {step === "code" && (
                        <form className={styles.verifyForm} onSubmit={handleVerifyCode}>
                            <label className={styles.verifyField}>
                                <span>Codigo de recuperacion</span>
                                <input name="codigo" type="text" placeholder="Codigo recibido" required />
                            </label>
                            <button className={styles.verifySubmit} type="submit" disabled={isLoading}>
                                Verificar codigo
                            </button>
                            <button className={styles.secondaryButton} type="button" disabled={isLoading} onClick={handleResendCode}>
                                Reenviar codigo
                            </button>
                            <button className={styles.secondaryButton} type="button" onClick={() => setStep("email")}>
                                Cambiar correo
                            </button>
                        </form>
                    )}

                    {step === "password" && (
                        <form className={styles.verifyForm} onSubmit={handleResetPassword}>
                            <label className={styles.verifyField}>
                                <span>Nueva contrasena</span>
                                <input name="nueva_password" type="password" autoComplete="new-password" minLength={8} required />
                            </label>
                            <label className={styles.verifyField}>
                                <span>Confirmar contrasena</span>
                                <input name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required />
                            </label>
                            <button className={styles.verifySubmit} type="submit" disabled={isLoading}>
                                Cambiar contrasena
                            </button>
                        </form>
                    )}

                    {step === "done" && (
                        <a className={styles.verifySubmit} href={routes.login}>
                            Iniciar sesion
                        </a>
                    )}

                    <p className={styles.switch}>
                        Recordaste tu contrasena? <a href={routes.login}>Inicia sesion</a>
                    </p>
                </section>
            </section>
        </main>
    );
}
