import { useEffect, useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import { getStoredSession, saveSession, type SessionUser } from "../../entities/session";
import { ApiError } from "../../shared/api";
import { profileApi } from "../../features/profile/api";
import { getMissingProfileFields, isProfileFieldFilled, type RequiredProfileField } from "../../features/profile/model";
import styles from "./profile.module.css";

type Props = {
    mode?: "view" | "edit";
};

export function ProfilePage({ mode = "view" }: Props) {
    const session = getStoredSession();
    const accessToken = session?.accessToken;
    const [profile, setProfile] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(accessToken));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(accessToken ? "" : "Inicia sesion para ver tu perfil.");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const isEditing = mode === "edit";
    const shouldPromptCompletion = new URLSearchParams(window.location.search).get("complete") === "1";

    useEffect(() => {
        if (!accessToken) {
            return;
        }

        let isMounted = true;

        profileApi.getProfile(accessToken)
            .then((userProfile) => {
                if (isMounted) {
                    setProfile(userProfile);
                }
            })
            .catch((requestError) => {
                if (isMounted) {
                    const message = requestError instanceof Error ? requestError.message : "No pudimos cargar tu perfil.";
                    setError(message);
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
    }, [accessToken]);

    if (isLoading) {
        return (
            <main className={styles.page}>
                <section className={styles.hero}>
                    <div>
                        <span className={styles.eyebrow}>Mi perfil</span>
                        <h1>Cargando perfil</h1>
                        <p>Estamos consultando tus datos de cuenta.</p>
                    </div>
                </section>
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className={styles.page}>
                <section className={styles.hero}>
                    <div>
                        <span className={styles.eyebrow}>Mi perfil</span>
                        <h1>No pudimos cargar tu perfil</h1>
                        <p>{error || "Intenta iniciar sesion nuevamente."}</p>
                    </div>
                    <a className={styles.primaryAction} href={routes.login}>Iniciar sesion</a>
                </section>
            </main>
        );
    }

    const displayName = [profile.nombre, profile.apellido_paterno, profile.apellido_materno]
        .filter(Boolean)
        .join(" ") || profile.email;
    const initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    const missingFields = getMissingProfileFields(profile);
    const hasMissingFields = missingFields.length > 0;
    const missingFieldNames = missingFields.map((field) => field.label).join(", ");
    const isMissingField = (field: RequiredProfileField) => {
        return !isProfileFieldFilled(profile[field]);
    };
    const fieldCardClassName = (field: RequiredProfileField) => {
        return `${styles.infoItem} ${isMissingField(field) ? styles.missingItem : ""}`;
    };

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!accessToken) {
            setFormError("Inicia sesion para actualizar tu perfil.");
            return;
        }

        const formData = new FormData(event.currentTarget);
        const nextProfile = {
            nombre: String(formData.get("nombre") ?? "").trim(),
            apellido_paterno: String(formData.get("apellido_paterno") ?? "").trim(),
            apellido_materno: String(formData.get("apellido_materno") ?? "").trim(),
            email: String(formData.get("email") ?? "").trim(),
            telefono: String(formData.get("telefono") ?? "").trim(),
        };
        const nextMissingFields = getMissingProfileFields(nextProfile);

        setFormError("");
        setSuccessMessage("");

        if (nextMissingFields.length > 0) {
            setFormError(`Completa estos campos: ${nextMissingFields.map((field) => field.label).join(", ")}.`);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextProfile.email)) {
            setFormError("Escribe un correo valido.");
            return;
        }

        if (!/^\d{10}$/.test(nextProfile.telefono.replace(/\D/g, ""))) {
            setFormError("Escribe un telefono celular de 10 digitos.");
            return;
        }

        setIsSaving(true);

        try {
            const updatedProfile = await profileApi.updateProfile(accessToken, {
                ...nextProfile,
                telefono: nextProfile.telefono.replace(/\D/g, ""),
            });

            setProfile(updatedProfile);
            saveSession({
                ...session,
                accessToken: session?.accessToken ?? accessToken,
                refreshToken: session?.refreshToken ?? "",
                user: {
                    ...session?.user,
                    ...updatedProfile,
                },
            });
            setSuccessMessage("Tus datos se actualizaron correctamente.");
            window.location.assign(routes.profile);
        } catch (requestError) {
            const message = requestError instanceof ApiError && requestError.status === 404
                ? "El backend no encontro la ruta para actualizar tu perfil."
                : requestError instanceof Error ? requestError.message : "No pudimos actualizar tu perfil.";
            setFormError(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <main className={styles.page}>
                <section className={styles.editHeader}>
                    <a href={routes.profile} className={styles.backLink}>Volver al perfil</a>
                    <div>
                        <span className={styles.eyebrow}>Editar perfil</span>
                        <h1>Actualiza tus datos</h1>
                        <p>Estos datos vienen de tu cuenta registrada en Evenxa.</p>
                    </div>
                </section>

                <form className={styles.editForm} onSubmit={handleProfileSubmit}>
                    {hasMissingFields && (
                        <div className={styles.warningBanner}>
                            <strong>Completa tus datos</strong>
                            <p>Necesitamos {missingFieldNames} para que puedas comprar boletos sin interrupciones.</p>
                        </div>
                    )}

                    {formError && <p className={styles.formError}>{formError}</p>}
                    {successMessage && <p className={styles.formSuccess}>{successMessage}</p>}

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <span className={styles.eyebrow}>Cuenta</span>
                                <h2>Informacion personal</h2>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <label className={isMissingField("nombre") ? styles.missingField : ""}>
                                Nombre
                                <input name="nombre" type="text" defaultValue={profile.nombre ?? ""} required />
                            </label>
                            <label className={isMissingField("apellido_paterno") ? styles.missingField : ""}>
                                Apellido paterno
                                <input name="apellido_paterno" type="text" defaultValue={profile.apellido_paterno ?? ""} required />
                            </label>
                            <label className={isMissingField("apellido_materno") ? styles.missingField : ""}>
                                Apellido materno
                                <input name="apellido_materno" type="text" defaultValue={profile.apellido_materno ?? ""} required />
                            </label>
                            <label className={isMissingField("email") ? styles.missingField : ""}>
                                Correo
                                <input name="email" type="email" defaultValue={profile.email} required />
                            </label>
                            <label className={isMissingField("telefono") ? styles.missingField : ""}>
                                Telefono
                                <input name="telefono" type="tel" defaultValue={profile.telefono ?? ""} inputMode="numeric" required />
                            </label>
                        </div>
                    </section>

                    <div className={styles.formActions}>
                        <a href={routes.profile}>Cancelar</a>
                        <button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</button>
                    </div>
                </form>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.avatar} aria-hidden="true">{initials}</div>

                <div>
                    <span className={styles.eyebrow}>Mi perfil</span>
                    <h1>{displayName}</h1>
                    <p>Administra tus datos de cuenta, revisa tus accesos y manten tu informacion lista para futuras compras.</p>
                </div>

                <a className={styles.primaryAction} href={routes.myTickets}>Ver mis boletos</a>
            </section>

            <section className={styles.layout}>
                {(hasMissingFields || shouldPromptCompletion) && (
                    <div className={styles.warningBanner}>
                        <strong>Completa tus datos</strong>
                        <p>
                            {hasMissingFields
                                ? `Te falta agregar: ${missingFieldNames}.`
                                : "Revisa que tu informacion este completa antes de comprar boletos."}
                        </p>
                        <a href={routes.editProfile}>Editar perfil</a>
                    </div>
                )}

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Cuenta</span>
                            <h2>Datos personales</h2>
                        </div>
                        <a href={routes.editProfile}>Editar</a>
                    </div>

                    <dl className={styles.infoGrid}>
                        <div className={fieldCardClassName("nombre")}>
                            <dt>Nombre</dt>
                            <dd>{profile.nombre || "Sin nombre"}</dd>
                        </div>
                        <div className={fieldCardClassName("apellido_paterno")}>
                            <dt>Apellido paterno</dt>
                            <dd>{profile.apellido_paterno || "Sin apellido"}</dd>
                        </div>
                        <div className={fieldCardClassName("apellido_materno")}>
                            <dt>Apellido materno</dt>
                            <dd>{profile.apellido_materno || "Sin apellido"}</dd>
                        </div>
                        <div className={fieldCardClassName("email")}>
                            <dt>Correo</dt>
                            <dd>{profile.email}</dd>
                        </div>
                        <div className={fieldCardClassName("telefono")}>
                            <dt>Telefono</dt>
                            <dd>{profile.telefono || "Sin telefono"}</dd>
                        </div>
                    </dl>
                </article>

            </section>
        </main>
    );
}
