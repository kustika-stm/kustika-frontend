import { useState } from "react";
import { AuthForm, type LoginFormValues } from "../../features/auth/ui";
import { authApi } from "../../features/auth/api";
import { saveSession } from "../../entities/session";
import { routes } from "../../app/router/routes";
import heroImage from "../../shared/assets/images/hero/hero.jpg";
import logo from "../../shared/assets/images/logo/logo-combinado.png";
import styles from "./login.module.css";

export function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (values: LoginFormValues) => {
        setIsLoading(true);
        setError("");

        try {
            const session = await authApi.login(values);
            saveSession(session);
            window.location.assign(routes.home);
        } catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : "No pudimos iniciar sesion.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.shell}>
                <aside className={styles.media}>
                    <img src={heroImage} alt="Concierto Evenxa" className={styles.mediaImage} />
                    <div className={styles.mediaOverlay} />
                    <div className={styles.mediaContent}>
                        <span className={styles.kicker}>Eventos sin friccion</span>
                        <h2>Tu proxima noche empieza aqui.</h2>
                        <p>Guarda favoritos, compra rapido y lleva tus boletos digitales contigo.</p>
                    </div>
                </aside>

                <section className={styles.panel}>
                    <div className={styles.copy}>
                        <img src={logo} alt="Evenxa" className={styles.formLogo} />
                        <h1>Iniciar sesion</h1>
                        <p>Entra a tu cuenta para guardar eventos y continuar tus compras.</p>
                    </div>

                    {error && <p className={`${styles.feedback} ${styles.error}`}>{error}</p>}

                    <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoading} />

                    <p className={styles.switch}>
                        Aun no tienes cuenta? <a href={routes.register}>Registrate</a>
                    </p>
                </section>
            </section>
        </main>
    );
}
