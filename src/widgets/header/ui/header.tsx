import { useState } from "react";
import styles from "./header.module.css";

import logo from "../../../shared/assets/images/logo/logo-combinado.png";

export const Header = () => {
    const [open, setOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <img src={logo} alt="Evenxa logo" className={styles.logo} />

                {/* Desktop nav */}
                <nav className={styles.navDesktop}>
                    <a href="#">Eventos</a>
                    <a href="#">Explorar</a>
                    <button className={styles.cta}>Ver eventos</button>
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
                    <a href="#">Eventos</a>
                    <a href="#">Explorar</a>
                    <button className={styles.cta}>Ver eventos</button>
                </div>
            )}
        </header>
    );
};