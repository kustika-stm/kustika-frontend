import { useEffect, useState } from "react";
import { routes } from "../../app/router/routes";
import { getStoredSession, type SessionUser } from "../../entities/session";
import { profileApi } from "../../features/profile/api";
import styles from "./profile.module.css";

type Props = {
    mode?: "view" | "edit";
};

export function ProfilePage({ mode = "view" }: Props) {
    const session = getStoredSession();
    const accessToken = session?.accessToken;
    const [profile, setProfile] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(accessToken));
    const [error, setError] = useState(accessToken ? "" : "Inicia sesion para ver tu perfil.");
    const isEditing = mode === "edit";

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

                <form className={styles.editForm}>
                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <span className={styles.eyebrow}>Cuenta</span>
                                <h2>Informacion personal</h2>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <label>
                                Nombre
                                <input name="nombre" type="text" defaultValue={profile.nombre ?? ""} />
                            </label>
                            <label>
                                Apellido paterno
                                <input name="apellido_paterno" type="text" defaultValue={profile.apellido_paterno ?? ""} />
                            </label>
                            <label>
                                Apellido materno
                                <input name="apellido_materno" type="text" defaultValue={profile.apellido_materno ?? ""} />
                            </label>
                            <label>
                                Correo
                                <input name="email" type="email" defaultValue={profile.email} />
                            </label>
                            <label>
                                Telefono
                                <input name="telefono" type="tel" defaultValue={profile.telefono ?? ""} />
                            </label>
                            <label>
                                Tipo de cuenta
                                <input name="tipo_usuario" type="text" defaultValue={profile.tipo_usuario ?? ""} disabled />
                            </label>
                        </div>
                    </section>

                    <div className={styles.formActions}>
                        <a href={routes.profile}>Cancelar</a>
                        <button type="button">Guardar cambios</button>
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
                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Cuenta</span>
                            <h2>Datos personales</h2>
                        </div>
                        <a href={routes.editProfile}>Editar</a>
                    </div>

                    <dl className={styles.infoGrid}>
                        <div>
                            <dt>Nombre</dt>
                            <dd>{profile.nombre || "Sin nombre"}</dd>
                        </div>
                        <div>
                            <dt>Apellido paterno</dt>
                            <dd>{profile.apellido_paterno || "Sin apellido"}</dd>
                        </div>
                        <div>
                            <dt>Apellido materno</dt>
                            <dd>{profile.apellido_materno || "Sin apellido"}</dd>
                        </div>
                        <div>
                            <dt>Correo</dt>
                            <dd>{profile.email}</dd>
                        </div>
                        <div>
                            <dt>Telefono</dt>
                            <dd>{profile.telefono || "Sin telefono"}</dd>
                        </div>
                        <div>
                            <dt>Tipo de cuenta</dt>
                            <dd>{profile.tipo_usuario || "Sin tipo asignado"}</dd>
                        </div>
                    </dl>
                </article>

            </section>
        </main>
    );
}
