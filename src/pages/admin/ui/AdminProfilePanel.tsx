import type { SessionUser } from "../../../entities/session";
import trashIcon from "../../../shared/assets/icons/basura.png";
import styles from "../admin.module.css";

type AdminProfilePanelProps = {
    profile: SessionUser | null;
    profileName: string;
    isLoading: boolean;
    isDeletingAccount: boolean;
    onDeleteAccount: () => void;
};

export function AdminProfilePanel({ profile, profileName, isLoading, isDeletingAccount, onDeleteAccount }: AdminProfilePanelProps) {
    return (
        <section className={styles.profilePanel}>
            <article className={styles.profileHero}>
                <div className={styles.profileAvatar} aria-hidden="true">
                    {profileName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <span>Administrador</span>
                    <h2>{isLoading ? "Cargando perfil" : profileName}</h2>
                    <p>Consulta los datos de tu cuenta administradora sin salir del panel.</p>
                </div>
            </article>

            <article className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div>
                        <span>Cuenta</span>
                        <h2>Datos personales</h2>
                    </div>
                </div>

                <dl className={styles.profileGrid}>
                    <div>
                        <dt>Nombre</dt>
                        <dd>{profile?.nombre || "Sin nombre"}</dd>
                    </div>
                    <div>
                        <dt>Apellido paterno</dt>
                        <dd>{profile?.apellido_paterno || "Sin apellido"}</dd>
                    </div>
                    <div>
                        <dt>Apellido materno</dt>
                        <dd>{profile?.apellido_materno || "Sin apellido"}</dd>
                    </div>
                    <div>
                        <dt>Correo</dt>
                        <dd>{profile?.email || "Sin correo"}</dd>
                    </div>
                    <div>
                        <dt>Telefono</dt>
                        <dd>{profile?.telefono || "Sin teléfono"}</dd>
                    </div>
                </dl>
            </article>

            <section className={styles.dangerZone}>
                <div>
                    <span>Zona sensible</span>
                    <h2>Eliminar cuenta</h2>
                    <p>Esta acción elimina tu cuenta y cierra la sesión actual.</p>
                </div>
                <button type="button" onClick={onDeleteAccount} disabled={isDeletingAccount}>
                    <img src={trashIcon} alt="" aria-hidden="true" />
                    {isDeletingAccount ? "Eliminando..." : "Eliminar cuenta"}
                </button>
            </section>
        </section>
    );
}
