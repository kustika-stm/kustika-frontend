import { useState } from "react";
import { routes } from "../../../app/router/routes";
import { clearSession, getStoredSession } from "../../../entities/session";
import { authApi } from "../../../features/auth/api";
import logo from "../../../shared/assets/images/logo/logo-combinado.png";
import styles from "./header.module.css";

const navLinks = [
    { label: "Inicio", href: routes.home },
    { label: "Eventos", href: routes.events },
    { label: "Categorias", href: routes.categories },
    { label: "Mis boletos", href: routes.myTickets },
];

export const Header = () => {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(() => getStoredSession());
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const pathname = window.location.pathname;
    const isAuthenticated = Boolean(session?.accessToken);

    const isActive = (href: string) => {
        if (href === routes.home) {
            return pathname === routes.home;
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const handleLogout = async () => {
        if (!session?.accessToken || isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            await authApi.logout(session.accessToken);
        } finally {
            clearSession();
            setSession(null);
            setOpen(false);
            window.location.assign(routes.home);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <a href={routes.home} className={styles.logoLink}>
                    <img src={logo} alt="Evenxa logo" className={styles.logo} />
                </a>

                <nav className={styles.navDesktop} aria-label="Navegacion principal">
                    {navLinks.map((link) => (
                        <a
                            href={link.href}
                            className={isActive(link.href) ? styles.activeLink : ""}
                            key={link.href}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className={styles.actions}>
                    {isAuthenticated ? (
                        <button
                            className={styles.logoutButton}
                            type="button"
                            disabled={isLoggingOut}
                            onClick={handleLogout}
                        >
                            {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                        </button>
                    ) : (
                        <>
                            <a className={styles.loginLink} href={routes.login}>Iniciar sesion</a>
                            <a className={styles.cta} href={routes.register}>Registrarse</a>
                        </>
                    )}
                </div>

                <button
                    className={styles.menuBtn}
                    type="button"
                    aria-label={open ? "Cerrar menu" : "Abrir menu"}
                    aria-expanded={open}
                    aria-controls="main-mobile-menu"
                    onClick={() => setOpen(!open)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {open && (
                <div id="main-mobile-menu" className={styles.mobileMenu}>
                    {navLinks.map((link) => (
                        <a
                            href={link.href}
                            className={isActive(link.href) ? styles.activeLink : ""}
                            key={link.href}
                        >
                            {link.label}
                        </a>
                    ))}

                    {isAuthenticated ? (
                        <button
                            className={styles.logoutButton}
                            type="button"
                            disabled={isLoggingOut}
                            onClick={handleLogout}
                        >
                            {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                        </button>
                    ) : (
                        <>
                            <a href={routes.login}>Iniciar sesion</a>
                            <a className={styles.cta} href={routes.register}>Registrarse</a>
                        </>
                    )}
                </div>
            )}
        </header>
    );
};
