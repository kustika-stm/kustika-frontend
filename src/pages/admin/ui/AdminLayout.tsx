import type { ReactNode } from "react";
import { routes } from "../../../app/router/routes";
import userIcon from "../../../shared/assets/icons/usuario.png";
import { kustikaMark } from "../../../shared/assets/images/logo";
import type { AdminPageName } from "../model/adminUtils";
import styles from "../admin.module.css";

type AdminLayoutProps = {
    activePage: AdminPageName;
    displayName: string;
    isLoggingOut: boolean;
    onLogout: () => void;
    children: ReactNode;
};

const pageTitles: Record<AdminPageName, string> = {
    users: "Usuarios",
    events: "Eventos",
    raffles: "Sorteos",
    requests: "Solicitudes",
    profile: "Mi perfil",
};

export function AdminLayout({ activePage, displayName, isLoggingOut, onLogout, children }: AdminLayoutProps) {
    return (
        <main className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <img src={kustikaMark} alt="Kustika" />
                    <span>Admin</span>
                </div>

                <nav className={styles.sideNav} aria-label="Panel de administracion">
                    <a className={activePage === "users" ? styles.activeNavItem : ""} href={routes.admin}>
                        Usuarios
                    </a>
                    <a className={activePage === "events" ? styles.activeNavItem : ""} href={routes.adminEvents}>
                        Eventos
                    </a>
                    <a className={activePage === "raffles" ? styles.activeNavItem : ""} href={routes.adminRaffles}>
                        Sorteos
                    </a>
                    <a className={activePage === "requests" ? styles.activeNavItem : ""} href={routes.adminRequests}>
                        Solicitudes
                    </a>
                    <a className={activePage === "profile" ? styles.activeNavItem : ""} href={routes.adminProfile}>
                        Mi perfil
                    </a>
                </nav>

                <button className={styles.sidebarLogout} type="button" onClick={onLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                </button>
            </aside>

            <section className={styles.workspace}>
                <header className={styles.topbar}>
                    <div>
                        <span>Panel de Control</span>
                        <h1>{pageTitles[activePage]}</h1>
                    </div>

                    <div className={styles.account}>
                        <img src={userIcon} alt="" aria-hidden="true" />
                        <strong>{displayName}</strong>
                    </div>
                </header>

                {children}
            </section>
        </main>
    );
}
