import { routes } from "../../app/router/routes";
import { getStoredSession } from "../../entities/session";
import styles from "./profile.module.css";

type Props = {
    mode?: "view" | "edit";
};

const mockProfile = {
    email: "usuario@evenxa.com",
    nombre: "Leonardo",
    apellido_paterno: "Lopez",
    apellido_materno: "Osornio",
    telefono: "4191187944",
    tipo_usuario: "Usuario",
};

const profileStats = [
    { label: "Boletos activos", value: "2" },
    { label: "Eventos asistidos", value: "8" },
    { label: "Compras", value: "12" },
];

const preferences = ["Musica en vivo", "Festivales", "Experiencias urbanas", "Comedia"];

export function ProfilePage({ mode = "view" }: Props) {
    const session = getStoredSession();
    const isEditing = mode === "edit";
    const user = session?.user;
    const displayName = [user?.nombre, user?.apellido_paterno, user?.apellido_materno]
        .filter(Boolean)
        .join(" ") || `${mockProfile.nombre} ${mockProfile.apellido_paterno}`;
    const initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const profile = {
        email: user?.email ?? mockProfile.email,
        nombre: user?.nombre ?? mockProfile.nombre,
        apellido_paterno: user?.apellido_paterno ?? mockProfile.apellido_paterno,
        apellido_materno: user?.apellido_materno ?? mockProfile.apellido_materno,
        telefono: user?.telefono ?? mockProfile.telefono,
        tipo_usuario: user?.tipo_usuario ?? mockProfile.tipo_usuario,
    };

    if (isEditing) {
        return (
            <main className={styles.page}>
                <section className={styles.editHeader}>
                    <a href={routes.profile} className={styles.backLink}>Volver al perfil</a>
                    <div>
                        <span className={styles.eyebrow}>Editar perfil</span>
                        <h1>Actualiza tus datos</h1>
                        <p>Esta pantalla esta lista como mock para conectar la ruta real cuando exista en el backend.</p>
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
                                <input name="nombre" type="text" defaultValue={profile.nombre} />
                            </label>
                            <label>
                                Apellido paterno
                                <input name="apellido_paterno" type="text" defaultValue={profile.apellido_paterno} />
                            </label>
                            <label>
                                Apellido materno
                                <input name="apellido_materno" type="text" defaultValue={profile.apellido_materno} />
                            </label>
                            <label>
                                Correo
                                <input name="email" type="email" defaultValue={profile.email} />
                            </label>
                            <label>
                                Telefono
                                <input name="telefono" type="tel" defaultValue={profile.telefono} />
                            </label>
                            <label>
                                Tipo de cuenta
                                <input name="tipo_usuario" type="text" defaultValue={profile.tipo_usuario} disabled />
                            </label>
                        </div>
                    </section>

                    <section className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <span className={styles.eyebrow}>Preferencias</span>
                                <h2>Intereses</h2>
                            </div>
                        </div>

                        <div className={styles.checkboxGrid}>
                            {preferences.map((preference) => (
                                <label key={preference}>
                                    <input type="checkbox" defaultChecked />
                                    <span>{preference}</span>
                                </label>
                            ))}
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

            <section className={styles.stats} aria-label="Resumen de actividad">
                {profileStats.map((stat) => (
                    <article key={stat.label}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                    </article>
                ))}
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
                            <dd>{profile.nombre}</dd>
                        </div>
                        <div>
                            <dt>Apellido paterno</dt>
                            <dd>{profile.apellido_paterno}</dd>
                        </div>
                        <div>
                            <dt>Apellido materno</dt>
                            <dd>{profile.apellido_materno}</dd>
                        </div>
                        <div>
                            <dt>Correo</dt>
                            <dd>{profile.email}</dd>
                        </div>
                        <div>
                            <dt>Telefono</dt>
                            <dd>{profile.telefono}</dd>
                        </div>
                        <div>
                            <dt>Tipo de cuenta</dt>
                            <dd>{profile.tipo_usuario}</dd>
                        </div>
                    </dl>
                </article>

                <aside className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Preferencias</span>
                            <h2>Intereses</h2>
                        </div>
                    </div>

                    <div className={styles.tags}>
                        {preferences.map((preference) => (
                            <span key={preference}>{preference}</span>
                        ))}
                    </div>
                </aside>
            </section>
        </main>
    );
}
