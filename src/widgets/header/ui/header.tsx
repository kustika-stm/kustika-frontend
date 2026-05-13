import { useState } from "react";
import styles from "./header.module.css";

import logo from "../../../shared/assets/images/logo/logo-combinado.png";
import { routes } from "../../../app/router/routes";

export const Header = () => {
    const [open, setOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <a href={routes.home} className={styles.logoLink}>
                    <img src={logo} alt="Evenxa logo" className={styles.logo} />
                </a>

                {/* Desktop nav */}
                <nav className={styles.navDesktop}>
                    <a href={routes.events}>Eventos</a>
                    <a href={routes.categories}>Explorar</a>
                    <a className={styles.loginLink} href={routes.login}>Iniciar sesion</a>
                    <a className={styles.cta} href={routes.register}>Registrarse</a>
                </nav>

                {/* Mobile menu button */}
                <button
                    className={styles.menuBtn}
                    onClick={() => setOpen(!open)}
                >
                    ☰
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className={styles.mobileMenu}>
                    <a href={routes.events}>Eventos</a>
                    <a href={routes.categories}>Explorar</a>
                    <a href={routes.login}>Iniciar sesion</a>
                    <a className={styles.cta} href={routes.register}>Registrarse</a>
                </div>
            )}
        </header>
    );
};
