import { useEffect, useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import { getStoredSession } from "../../entities/session";
import { organizerRequestsApi, type OrganizerRequest } from "../../features/organizers/api";
import styles from "./organizer-request.module.css";

const statusLabels: Record<string, string> = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
};

export function OrganizerRequestPage() {
    const session = getStoredSession();
    const token = session?.accessToken ?? "";
    const [request, setRequest] = useState<OrganizerRequest | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(token));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        organizerRequestsApi.getMyRequest(token)
            .then((currentRequest) => {
                if (isMounted) {
                    setRequest(currentRequest);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setRequest(null);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            window.location.assign(routes.login);
            return;
        }

        const formData = new FormData(event.currentTarget);
        const nombre_empresa = String(formData.get("nombre_empresa") ?? "").trim();
        const rfc = String(formData.get("rfc") ?? "").trim().toUpperCase();

        setMessage(null);

        if (!nombre_empresa || !rfc) {
            setMessage({ type: "error", text: "Completa el nombre de empresa y RFC." });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await organizerRequestsApi.createRequest(token, { nombre_empresa, rfc });
            const currentRequest = await organizerRequestsApi.getMyRequest(token);

            setRequest(currentRequest);
            setMessage({ type: "success", text: response.message || "Solicitud enviada correctamente." });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos enviar tu solicitud.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <main className={styles.page}>
                <section className={styles.hero}>
                    <span className={styles.eyebrow}>Publicar eventos</span>
                    <h1>Inicia sesion para solicitar acceso</h1>
                    <p>Necesitas una cuenta de Evenxa para pedir aprobacion como organizador.</p>
                    <a className={styles.primaryAction} href={routes.login}>Iniciar sesion</a>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <span className={styles.eyebrow}>Publicar eventos</span>
                <h1>Solicita acceso como organizador</h1>
                <p>Envianos los datos de tu empresa. Un administrador revisara la solicitud y, si es aprobada, tu proximo inicio de sesion tendra permisos para publicar eventos.</p>
            </section>

            <section className={styles.layout}>
                <form className={styles.panel} onSubmit={handleSubmit}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Solicitud</span>
                            <h2>Datos fiscales</h2>
                        </div>
                    </div>

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`} role="status" aria-live="polite">
                            {message.text}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <label>
                            Nombre de empresa
                            <input name="nombre_empresa" type="text" defaultValue={request?.nombre_empresa ?? ""} disabled={Boolean(request)} required />
                        </label>
                        <label>
                            RFC
                            <input name="rfc" type="text" defaultValue={request?.rfc ?? ""} disabled={Boolean(request)} required />
                        </label>
                    </div>

                    <button type="submit" disabled={isSubmitting || Boolean(request)}>
                        {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                    </button>
                </form>

                <aside className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Estado</span>
                            <h2>Mi solicitud</h2>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className={styles.emptyState}>
                            <strong>Cargando solicitud</strong>
                            <p>Estamos revisando si ya tienes una solicitud registrada.</p>
                        </div>
                    ) : request ? (
                        <div className={styles.statusCard}>
                            <span className={styles[request.status]}>{statusLabels[request.status] ?? request.status}</span>
                            <strong>{request.nombre_empresa}</strong>
                            <p>{request.rfc}</p>
                            {request.status === "aprobada" && (
                                <p>Tu solicitud fue aprobada. Cierra sesion e inicia de nuevo para actualizar tu token.</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <strong>Aun no has enviado solicitud</strong>
                            <p>Completa el formulario para que el equipo admin pueda revisarla.</p>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
}
