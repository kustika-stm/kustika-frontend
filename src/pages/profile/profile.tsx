import { useEffect, useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import {
    clearSession,
    getAuthSessionPhotoUrl,
    getSessionUserPhotoUrl,
    getStoredSession,
    saveSession,
    type SessionUser,
} from "../../entities/session";
import { ApiError } from "../../shared/api";
import { useAlerts } from "../../shared/ui/alerts";
import { profileApi } from "../../features/profile/api";
import { getMissingProfileFields, isProfileFieldFilled, type RequiredProfileField } from "../../features/profile/model";
import trashIcon from "../../shared/assets/icons/basura.png";
import styles from "./profile.module.css";

type Props = {
    mode?: "view" | "edit";
};

export function ProfilePage({ mode = "view" }: Props) {
    const alerts = useAlerts();
    const session = getStoredSession();
    const accessToken = session?.accessToken;
    const [profile, setProfile] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(accessToken));
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(accessToken ? "" : "Inicia sesión para ver tu perfil.");
    const [formError, setFormError] = useState("");
    const [hasProfilePhotoError, setHasProfilePhotoError] = useState(false);
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
                    const currentSession = getStoredSession();

                    setProfile({
                        ...currentSession?.user,
                        ...userProfile,
                        foto_url: userProfile.foto_url ?? currentSession?.user?.foto_url ?? getAuthSessionPhotoUrl(currentSession),
                        avatar_url: userProfile.avatar_url ?? currentSession?.user?.avatar_url,
                        photo_url: userProfile.photo_url ?? currentSession?.user?.photo_url,
                        picture: userProfile.picture ?? currentSession?.user?.picture,
                    });
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
                        <p>{error || "Intenta iniciar sesión nuevamente."}</p>
                    </div>
                    <a className={styles.primaryAction} href={routes.login}>Iniciar sesión</a>
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
    const profilePhotoUrl = hasProfilePhotoError ? "" : getSessionUserPhotoUrl(profile) || getAuthSessionPhotoUrl(session);
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
            setFormError("Inicia sesión para actualizar tu perfil.");
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

        if (nextMissingFields.length > 0) {
            setFormError(`Completa estos campos: ${nextMissingFields.map((field) => field.label).join(", ")}.`);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextProfile.email)) {
            setFormError("Escribe un correo válido.");
            return;
        }

        if (!/^\d{10}$/.test(nextProfile.telefono.replace(/\D/g, ""))) {
            setFormError("Escribe un teléfono celular de 10 dígitos.");
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
            alerts.notify({
                tone: "success",
                title: "Perfil actualizado",
                message: "Tus datos se actualizaron correctamente.",
            });
            window.location.assign(routes.profile);
        } catch (requestError) {
            const message = requestError instanceof ApiError && requestError.status === 404
                ? "El backend no encontró la ruta para actualizar tu perfil."
                : requestError instanceof Error ? requestError.message : "No pudimos actualizar tu perfil.";
            setFormError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!accessToken) {
            alerts.notify({
                tone: "error",
                title: "Sesión requerida",
                message: "Inicia sesión para eliminar tu cuenta.",
            });
            return;
        }

        const shouldDelete = await alerts.confirm({
            tone: "error",
            title: "Eliminar cuenta",
            message: "Esta acción eliminará tu cuenta de Kustika y cerrará tu sesión actual.",
            confirmLabel: "Eliminar cuenta",
        });

        if (!shouldDelete) {
            return;
        }

        setIsDeleting(true);

        try {
            await profileApi.deleteAccount(accessToken);
            clearSession();
            window.location.assign(routes.login);
        } catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : "No pudimos eliminar tu cuenta.";

            alerts.notify({
                tone: "error",
                title: "No pudimos eliminar tu cuenta",
                message,
            });
        } finally {
            setIsDeleting(false);
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
                        <p>Estos datos vienen de tu cuenta registrada en Kustika.</p>
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

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <span className={styles.eyebrow}>Cuenta</span>
                            <h2>Información personal</h2>
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
                                Teléfono
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
                <div className={styles.avatar} aria-hidden="true">
                    {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" onError={() => setHasProfilePhotoError(true)} /> : initials}
                </div>

                <div>
                    <span className={styles.eyebrow}>Mi perfil</span>
                    <h1>{displayName}</h1>
                    <p>Administra tus datos de cuenta, revisa tus accesos y mantén tu información lista para futuras compras.</p>
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
                                : "Revisa que tu información esté completa antes de comprar boletos."}
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
                            <dt>Teléfono</dt>
                            <dd>{profile.telefono || "Sin teléfono"}</dd>
                        </div>
                    </dl>
                </article>

                <section className={styles.dangerZone}>
                    <div>
                        <span className={styles.eyebrow}>Zona sensible</span>
                        <h2>Eliminar cuenta</h2>
                        <p>Esta acción borra tu cuenta y cerrará tu sesión actual.</p>
                    </div>
                    <button type="button" onClick={handleDeleteAccount} disabled={isDeleting}>
                        <img className={styles.deleteIcon} src={trashIcon} alt="" aria-hidden="true" />
                        {isDeleting ? "Eliminando..." : "Eliminar cuenta"}
                    </button>
                </section>
            </section>
        </main>
    );
}
