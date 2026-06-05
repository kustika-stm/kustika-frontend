import { useState } from "react";
import { routes } from "../../../app/router/routes";
import { clearSession, getAuthSessionPhotoUrl, getSessionRole, getStoredSession, getTokenRole } from "../../../entities/session";
import { authApi } from "../../../features/auth/api";
import userIcon from "../../../shared/assets/icons/usuario.png";
import { kustikaWordmark } from "../../../shared/assets/images/logo";
import styles from "./header.module.css";

const navLinks = [
    { label: "Inicio", href: routes.home },
    { label: "Eventos", href: routes.events },
    { label: "Sorteos", href: routes.raffles, featured: true },
    { label: "Categorías", href: routes.categories },
];

const authNavLinks = [
    { label: "Mis boletos", href: routes.myTickets },
];

const eventCustomerNavLinks = [
    { label: "Panel eventos", href: routes.eventCustomer },
];

const adminNavLinks = [
    { label: "Usuarios", href: routes.admin },
];

const getNavLinks = (role: string, isAuthenticated: boolean) => {
    if (!isAuthenticated) {
        return navLinks;
    }

    if (role === "admin") {
        return adminNavLinks;
    }

    if (role === "event_customer") {
        return eventCustomerNavLinks;
    }

    return [...navLinks, ...authNavLinks];
};

const getDisplayName = (session: ReturnType<typeof getStoredSession>) => {
    const user = session?.user;
    const fullName = [user?.nombre, user?.apellido_paterno]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || user?.email?.split("@")[0] || "Perfil";
};

export const Header = () => {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(() => getStoredSession());
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [hasProfilePhotoError, setHasProfilePhotoError] = useState(false);
    const pathname = window.location.pathname;
    const isAuthenticated = Boolean(session?.accessToken);
    const role = getTokenRole(session?.accessToken) ?? getSessionRole(session);
    const profilePhotoUrl = hasProfilePhotoError ? "" : getAuthSessionPhotoUrl(session);
    const profileName = getDisplayName(session);
    const visibleNavLinks = getNavLinks(role, isAuthenticated);

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

    const handleCreateEvent = () => {
        if (!session?.accessToken) {
            window.location.assign(routes.login);
            return;
        }

        setOpen(false);
        window.location.assign(role === "event_customer" ? routes.eventCustomer : routes.organizerRequest);
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <a href={routes.home} className={styles.logoLink}>
                    <img src={kustikaWordmark} alt="Kustika logo" className={styles.logo} />
                </a>

                <div className={styles.navArea}>
                    <nav className={styles.navDesktop} aria-label="Navegación principal">
                        {visibleNavLinks.map((link) => (
                            <a
                                href={link.href}
                                className={[
                                    isActive(link.href) ? styles.activeLink : "",
                                    "featured" in link && link.featured ? styles.raffleLink : "",
                                ].filter(Boolean).join(" ")}
                                key={link.href}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {(!isAuthenticated || role === "customer") && (
                        <button className={styles.navCtaButton} type="button" onClick={handleCreateEvent}>
                            Hacer evento
                        </button>
                    )}
                </div>

                <div className={styles.actions}>
                    {isAuthenticated ? (
                        <>
                            <a
                                className={`${styles.profileLink} ${isActive(routes.profile) ? styles.profileLinkActive : ""}`}
                                href={routes.profile}
                                aria-label={`Ver perfil de ${profileName}`}
                                title="Perfil"
                            >
                                <img
                                    className={profilePhotoUrl ? styles.profilePhoto : ""}
                                    src={profilePhotoUrl || userIcon}
                                    alt=""
                                    aria-hidden="true"
                                    onError={() => setHasProfilePhotoError(true)}
                                />
                                <span>{profileName}</span>
                            </a>
                            <button
                                className={styles.logoutButton}
                                type="button"
                                disabled={isLoggingOut}
                                onClick={handleLogout}
                            >
                                {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                            </button>
                        </>
                    ) : (
                        <>
                            <a className={styles.loginLink} href={routes.login}>Iniciar sesión</a>
                            <a className={styles.cta} href={routes.register}>Registrarse</a>
                        </>
                    )}
                </div>

                <button
                    className={styles.menuBtn}
                    type="button"
                    aria-label={open ? "Cerrar menú" : "Abrir menú"}
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
                    {visibleNavLinks.map((link) => (
                        <a
                            href={link.href}
                            className={[
                                isActive(link.href) ? styles.activeLink : "",
                                "featured" in link && link.featured ? styles.raffleLink : "",
                            ].filter(Boolean).join(" ")}
                            key={link.href}
                        >
                            {link.label}
                        </a>
                    ))}

                    {isAuthenticated ? (
                        <>
                            {role === "customer" && (
                                <button className={styles.ctaButton} type="button" onClick={handleCreateEvent}>
                                    Hacer evento
                                </button>
                            )}
                            <a
                                className={`${styles.mobileProfileLink} ${isActive(routes.profile) ? styles.activeLink : ""}`}
                                href={routes.profile}
                            >
                                <img
                                    className={profilePhotoUrl ? styles.profilePhoto : ""}
                                    src={profilePhotoUrl || userIcon}
                                    alt=""
                                    aria-hidden="true"
                                    onError={() => setHasProfilePhotoError(true)}
                                />
                                {profileName}
                            </a>
                            <button
                                className={styles.logoutButton}
                                type="button"
                                disabled={isLoggingOut}
                                onClick={handleLogout}
                            >
                                {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.ctaButton} type="button" onClick={handleCreateEvent}>
                                Hacer evento
                            </button>
                            <a href={routes.login}>Iniciar sesión</a>
                            <a className={styles.cta} href={routes.register}>Registrarse</a>
                        </>
                    )}
                </div>
            )}
        </header>
    );
};
