import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import { clearSession, getStoredSession } from "../../entities/session";
import { organizerRequestsApi, type OrganizerRequest } from "../../features/organizers/api";
import { getMissingProfileFields, isProfileComplete } from "../../features/profile/model";
import { ApiError } from "../../shared/api";
import { useAlerts } from "../../shared/ui/alerts";
import styles from "./organizer-request.module.css";

const statusLabels: Record<string, string> = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
};

const getMyRequest = async (token: string) => {
    try {
        return await organizerRequestsApi.getMyRequest(token);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return null;
        }

        throw error;
    }
};

export function OrganizerRequestPage() {
    const alerts = useAlerts();
    const session = getStoredSession();
    const token = session?.accessToken ?? "";
    const [request, setRequest] = useState<OrganizerRequest | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(token));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rfcFile, setRfcFile] = useState<File | null>(null);
    const [rfcFileError, setRfcFileError] = useState("");
    const profileRedirectNoticeShown = useRef(false);
    const isMissingProfile = Boolean(token) && !isProfileComplete(session?.user);

    useEffect(() => {
        if (!token || isMissingProfile) {
            return;
        }

        let isMounted = true;

        getMyRequest(token)
            .then((currentRequest) => {
                if (isMounted) {
                    setRequest(currentRequest);
                }
            })
            .catch((error) => {
                if (isMounted) {
                    alerts.notify({
                        tone: "error",
                        title: "Solicitud no disponible",
                        message: error instanceof ApiError
                            ? error.technicalMessage ?? error.message
                            : error instanceof Error ? error.message : "No pudimos consultar tu solicitud.",
                    });
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
    }, [alerts, isMissingProfile, token]);

    useEffect(() => {
        if (!isMissingProfile) {
            return;
        }

        if (!profileRedirectNoticeShown.current) {
            profileRedirectNoticeShown.current = true;
            const missingFields = getMissingProfileFields(session?.user)
                .map((field) => field.label)
                .join(", ");

            alerts.notify({
                tone: "warning",
                title: "Completa tu perfil",
                message: missingFields
                    ? `Te falta agregar: ${missingFields}. Te redirigimos a tu perfil para completar tus datos.`
                    : "Te redirigimos para completar tu perfil.",
                durationMs: 3200,
            });
        }

        const redirectTimer = window.setTimeout(() => {
            window.location.assign(`${routes.profile}?complete=1`);
        }, 1200);

        return () => window.clearTimeout(redirectTimer);
    }, [alerts, isMissingProfile, session?.user]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            window.location.assign(routes.login);
            return;
        }

        const values = new FormData(event.currentTarget);
        const nombreEmpresa = String(values.get("nombre_empresa") ?? "").trim();
        const descripcion = String(values.get("descripcion") ?? "").trim();
        const telefonoEmpresa = String(values.get("telefono_empresa") ?? "").trim();
        const emailContacto = String(values.get("email_contacto") ?? "").trim();
        const sitioWeb = String(values.get("sitio_web") ?? "").trim();

        if (nombreEmpresa.length < 2 || nombreEmpresa.length > 150) {
            alerts.notify({ tone: "error", title: "Nombre de empresa inválido", message: "El nombre de empresa debe tener entre 2 y 150 caracteres." });
            return;
        }

        if (descripcion.length < 10 || descripcion.length > 2000) {
            alerts.notify({ tone: "error", title: "Descripción inválida", message: "La descripción debe tener entre 10 y 2000 caracteres." });
            return;
        }

        if (!/^\+?\d{10,15}$/.test(telefonoEmpresa)) {
            alerts.notify({ tone: "error", title: "Teléfono inválido", message: "El teléfono debe tener entre 10 y 15 dígitos y puede comenzar con +." });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContacto)) {
            alerts.notify({ tone: "error", title: "Email inválido", message: "Escribe un email de contacto válido." });
            return;
        }

        if (!rfcFile) {
            setRfcFileError("Selecciona el documento RFC en formato PDF.");
            return;
        }

        if (rfcFile.type !== "application/pdf") {
            setRfcFileError("El documento RFC debe ser un archivo PDF.");
            return;
        }

        if (sitioWeb) {
            try {
                const websiteUrl = new URL(sitioWeb);

                if (websiteUrl.protocol !== "http:" && websiteUrl.protocol !== "https:") {
                    throw new Error("Invalid protocol");
                }
            } catch {
                alerts.notify({ tone: "error", title: "Sitio web inválido", message: "Escribe una URL válida." });
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const requestFormData = new FormData();
            requestFormData.append("nombre_empresa", nombreEmpresa);
            requestFormData.append("rfc", rfcFile);
            requestFormData.append("descripcion", descripcion);
            requestFormData.append("telefono_empresa", telefonoEmpresa);
            requestFormData.append("email_contacto", emailContacto);

            if (sitioWeb) {
                requestFormData.append("sitio_web", sitioWeb);
            }

            const response = await organizerRequestsApi.createRequest(token, requestFormData);

            setRequest(response.data);
            alerts.notify({
                tone: "success",
                title: "Solicitud enviada",
                message: "Solicitud enviada correctamente.",
            });
        } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
                try {
                    setRequest(await getMyRequest(token));
                } catch {
                    // The original conflict remains the most useful error to show.
                }
            }

            alerts.notify({
                tone: "error",
                title: "No pudimos enviar tu solicitud",
                message: error instanceof ApiError
                    ? error.technicalMessage ?? error.message
                    : error instanceof Error ? error.message : "No pudimos enviar tu solicitud.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRfcFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0] ?? null;

        if (file && file.type !== "application/pdf") {
            event.currentTarget.value = "";
            setRfcFile(null);
            setRfcFileError("El documento RFC debe ser un archivo PDF.");
            return;
        }

        setRfcFile(file);
        setRfcFileError("");
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
                    <h1>Inicia sesión para solicitar acceso</h1>
                    <p>Necesitas una cuenta de Kustika para pedir aprobación como organizador.</p>
                    <a className={styles.primaryAction} href={routes.login}>Iniciar sesión</a>
                </section>
            </main>
        );
    }

    if (isMissingProfile) {
        return (
            <main className={styles.page}>
                <section className={styles.hero}>
                    <span className={styles.eyebrow}>Completa tu perfil</span>
                    <h1>Necesitamos tus datos completos</h1>
                    <p>Te estamos redirigiendo a tu perfil para completar tus datos antes de solicitar acceso como organizador.</p>
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
                <p>Envíanos los datos de tu empresa. Un administrador revisará la solicitud y, si es aprobada, tu próximo inicio de sesión tendrá permisos para publicar eventos.</p>
            </section>

            <nav className={styles.steps} aria-label="Progreso de solicitud">
                <span className={currentStep === 1 ? styles.currentStep : styles.doneStep}>1. Registro</span>
                <span className={currentStep === 2 ? styles.currentStep : currentStep > 2 ? styles.doneStep : ""}>2. Revisión</span>
                <span className={currentStep === 3 ? styles.currentStep : ""}>3. Activación</span>
            </nav>

            <section className={styles.layout}>
                {isLoading && (
                <section className={styles.panel}>
                    <div className={styles.emptyState}>
                        <strong>Cargando solicitud</strong>
                        <p>Estamos consultando el estado de tu solicitud.</p>
                    </div>
                </section>
                )}

                {!isLoading && currentStep === 1 && (
                <form className={styles.panel} onSubmit={handleSubmit}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Solicitud</span>
                            <h2>Datos fiscales</h2>
                        </div>
                    </div>

                    {request?.status === "rechazada" && (
                        <div className={styles.rejectionNotice}>
                            <strong>Tu solicitud fue rechazada.</strong>
                            <p>{request.motivo_rechazo || "Corrige la información y envía una nueva solicitud."}</p>
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <label>
                            Nombre de empresa
                            <input
                                name="nombre_empresa"
                                type="text"
                                minLength={2}
                                maxLength={150}
                                defaultValue={request?.nombre_empresa ?? ""}
                                disabled={!canSubmitRequest}
                                required
                            />
                        </label>
                        <label>
                            Documento RFC
                            <input
                                name="rfc"
                                type="file"
                                accept="application/pdf"
                                disabled={!canSubmitRequest}
                                onChange={handleRfcFileChange}
                                required
                            />
                            {rfcFile && <span className={styles.fileName}>{rfcFile.name}</span>}
                            {rfcFileError && <span className={styles.fileError}>{rfcFileError}</span>}
                        </label>
                        <label className={styles.fullField}>
                            Descripción
                            <textarea
                                name="descripcion"
                                rows={4}
                                minLength={10}
                                maxLength={2000}
                                defaultValue={request?.descripcion ?? ""}
                                disabled={!canSubmitRequest}
                                required
                            />
                        </label>
                        <label>
                            Teléfono de empresa
                            <input
                                name="telefono_empresa"
                                type="tel"
                                inputMode="tel"
                                pattern="\+?[0-9]{10,15}"
                                defaultValue={request?.telefono_empresa ?? ""}
                                disabled={!canSubmitRequest}
                                required
                            />
                        </label>
                        <label>
                            Email de contacto
                            <input name="email_contacto" type="email" defaultValue={request?.email_contacto ?? ""} disabled={!canSubmitRequest} required />
                        </label>
                        <label className={styles.fullField}>
                            Sitio web (opcional)
                            <input name="sitio_web" type="url" placeholder="https://eventosleo.com" defaultValue={request?.sitio_web ?? ""} disabled={!canSubmitRequest} />
                        </label>
                    </div>

                    <button type="submit" disabled={isSubmitting || !canSubmitRequest}>
                        {isSubmitting ? "Enviando..." : request?.status === "rechazada" ? "Reenviar solicitud" : "Enviar solicitud"}
                    </button>
                </form>
                )}

                {!isLoading && currentStep === 2 && (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Estado</span>
                            <h2>Mi solicitud</h2>
                        </div>
                    </div>

                    {request ? (
                        <div className={styles.statusCard}>
                            <span className={styles[request.status]}>{statusLabels[request.status] ?? request.status}</span>
                            <strong>{request.nombre_empresa}</strong>
                            {request.status === "pendiente" && (
                                <p>Tu solicitud está pendiente de revisión.</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <strong>Aún no has enviado solicitud</strong>
                            <p>Completa el formulario para que el equipo admin pueda revisarla.</p>
                        </div>
                    )}
                </section>
                )}

                {!isLoading && currentStep === 3 && (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Activación</span>
                            <h2>Cuenta aprobada</h2>
                        </div>
                    </div>

                    <div className={styles.statusCard}>
                        <span className={styles.aprobada}>Aprobada</span>
                        <strong>{request?.nombre_empresa}</strong>
                        <p>Tu solicitud fue aprobada.</p>
                        <button type="button" onClick={handleRefreshAccess}>Actualizar acceso</button>
                    </div>
                </section>
                )}
            </section>
        </main>
    );
}
