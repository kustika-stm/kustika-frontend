import { useEffect, useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import { clearSession, getStoredSession } from "../../entities/session";
import { organizerRequestsApi, type OrganizerRequest } from "../../features/organizers/api";
import { ApiError } from "../../shared/api";
import styles from "./organizer-request.module.css";

const statusLabels: Record<string, string> = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
};

const optionalFields = ["descripcion", "telefono_empresa", "email_contacto", "sitio_web"] as const;

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
            .catch((error) => {
                if (isMounted) {
                    if (error instanceof ApiError && error.status !== 404) {
                        setMessage({ type: "error", text: error.message });
                    }

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
        const payload = {
            nombre_empresa,
            rfc,
            ...Object.fromEntries(
                optionalFields
                    .map((field) => [field, String(formData.get(field) ?? "").trim()])
                    .filter(([, value]) => value),
            ),
        };
        const telefonoEmpresa = String(payload.telefono_empresa ?? "");
        const emailContacto = String(payload.email_contacto ?? "");
        const sitioWeb = String(payload.sitio_web ?? "");

        setMessage(null);

        if (!nombre_empresa || !rfc) {
            setMessage({ type: "error", text: "Completa el nombre de empresa y RFC." });
            return;
        }

        if (telefonoEmpresa && !/^\d{10}$/.test(telefonoEmpresa.replace(/\D/g, ""))) {
            setMessage({ type: "error", text: "El telefono de empresa debe tener 10 digitos." });
            return;
        }

        if (emailContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContacto)) {
            setMessage({ type: "error", text: "Escribe un email de contacto valido." });
            return;
        }

        if (sitioWeb && !/^https?:\/\/.+\..+/.test(sitioWeb)) {
            setMessage({ type: "error", text: "El sitio web debe iniciar con http:// o https://." });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await organizerRequestsApi.createRequest(token, {
                ...payload,
                telefono_empresa: telefonoEmpresa ? telefonoEmpresa.replace(/\D/g, "") : undefined,
            });

            setRequest(response.data);
            setMessage({ type: "success", text: "Solicitud enviada correctamente." });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos enviar tu solicitud.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefreshAccess = () => {
        clearSession();
        window.location.assign(routes.login);
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

    const currentStep = request?.status === "aprobada"
        ? 3
        : request && request.status !== "rechazada"
            ? 2
            : 1;
    const canSubmitRequest = !request || request.status === "rechazada";

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <span className={styles.eyebrow}>Publicar eventos</span>
                <h1>Solicita acceso como organizador</h1>
                <p>Envianos los datos de tu empresa. Un administrador revisara la solicitud y, si es aprobada, tu proximo inicio de sesion tendra permisos para publicar eventos.</p>
            </section>

            <nav className={styles.steps} aria-label="Progreso de solicitud">
                <span className={currentStep === 1 ? styles.currentStep : styles.doneStep}>1. Registro</span>
                <span className={currentStep === 2 ? styles.currentStep : currentStep > 2 ? styles.doneStep : ""}>2. Revision</span>
                <span className={currentStep === 3 ? styles.currentStep : ""}>3. Activacion</span>
            </nav>

            <section className={styles.layout}>
                {currentStep === 1 && (
                <form className={styles.panel} onSubmit={handleSubmit}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Solicitud</span>
                            <h2>Datos fiscales</h2>
                        </div>
                    </div>

                    {request?.status === "rechazada" && (
                        <div className={`${styles.message} ${styles.error}`} role="status" aria-live="polite">
                            Solicitud rechazada{request.motivo_rechazo ? `: ${request.motivo_rechazo}` : "."} Corrige la informacion y vuelve a enviarla.
                        </div>
                    )}

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`} role="status" aria-live="polite">
                            {message.text}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <label>
                            Nombre de empresa
                            <input name="nombre_empresa" type="text" defaultValue={request?.nombre_empresa ?? ""} disabled={!canSubmitRequest} required />
                        </label>
                        <label>
                            RFC
                            <input name="rfc" type="text" defaultValue={request?.rfc ?? ""} disabled={!canSubmitRequest} required />
                        </label>
                        <label className={styles.fullField}>
                            Descripcion
                            <textarea name="descripcion" rows={4} defaultValue={request?.descripcion ?? ""} disabled={!canSubmitRequest} />
                        </label>
                        <label>
                            Telefono de empresa
                            <input name="telefono_empresa" type="tel" inputMode="numeric" defaultValue={request?.telefono_empresa ?? ""} disabled={!canSubmitRequest} />
                        </label>
                        <label>
                            Email de contacto
                            <input name="email_contacto" type="email" defaultValue={request?.email_contacto ?? ""} disabled={!canSubmitRequest} />
                        </label>
                        <label className={styles.fullField}>
                            Sitio web
                            <input name="sitio_web" type="url" placeholder="https://eventosleo.com" defaultValue={request?.sitio_web ?? ""} disabled={!canSubmitRequest} />
                        </label>
                    </div>

                    <button type="submit" disabled={isSubmitting || !canSubmitRequest}>
                        {isSubmitting ? "Enviando..." : request?.status === "rechazada" ? "Reenviar solicitud" : "Enviar solicitud"}
                    </button>
                </form>
                )}

                {currentStep === 2 && (
                <section className={styles.panel}>
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
                            {request.status === "pendiente" && (
                                <p>Tu solicitud esta en revision. Te avisaremos cuando cambie de estado.</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <strong>Aun no has enviado solicitud</strong>
                            <p>Completa el formulario para que el equipo admin pueda revisarla.</p>
                        </div>
                    )}
                </section>
                )}

                {currentStep === 3 && (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Activacion</span>
                            <h2>Cuenta aprobada</h2>
                        </div>
                    </div>

                    <div className={styles.statusCard}>
                        <span className={styles.aprobada}>Aprobada</span>
                        <strong>{request?.nombre_empresa}</strong>
                        <p>Tu solicitud fue aprobada. Para convertir tu cuenta a event manager necesitas iniciar sesion de nuevo y recibir un token actualizado.</p>
                        <button type="button" onClick={handleRefreshAccess}>Actualizar acceso</button>
                    </div>
                </section>
                )}
            </section>
        </main>
    );
}
