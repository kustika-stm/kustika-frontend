import { routes } from "../../../app/router/routes";
import facebookIcon from "../../../shared/assets/icons/facebook.svg";
import instagramIcon from "../../../shared/assets/icons/instagram.svg";
import tiktokIcon from "../../../shared/assets/icons/tiktok.svg";
import youtubeIcon from "../../../shared/assets/icons/youtube.avif";
import logo from "../../../shared/assets/images/logo/logo-combinado.png";
import styles from "./footer.module.css";

const socialLinks = [
    {
        label: "Instagram",
        href: "https://www.instagram.com/evenxamx/",
        icon: instagramIcon,
    },
    {
        label: "Facebook",
        href: "https://www.facebook.com/profile.php?id=61589050558943",
        icon: facebookIcon,
    },
    {
        label: "TikTok",
        href: "https://www.tiktok.com/@evenxamx",
        icon: tiktokIcon,
    },
    {
        label: "YouTube",
        href: "https://www.youtube.com/channel/UCus_NEYv9u5LHG0SXGyqg8A",
        icon: youtubeIcon,
    },
];

export function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.brand}>
                    <a href={routes.home} aria-label="Evenxa inicio">
                        <img src={logo} alt="Evenxa" />
                    </a>

                    <p>Vive la experiencia.</p>

                    <div className={styles.socials} aria-label="Redes sociales">
                        {socialLinks.map((social) => (
                            <a
                                href={social.href}
                                aria-label={social.label}
                                target="_blank"
                                rel="noreferrer"
                                key={social.label}
                            >
                                <img src={social.icon} alt="" aria-hidden="true" />
                            </a>
                        ))}
                    </div>
                </div>

                <nav className={styles.column} aria-label="Navegacion secundaria">
                    <h2>Evenxa</h2>
                    <a href={routes.events}>Eventos</a>
                    <a href={routes.categories}>Explorar</a>
                    <a href={routes.login}>Iniciar sesion</a>
                    <a href={routes.register}>Registrarse</a>
                </nav>

                <div className={styles.column}>
                    <h2>Contacto</h2>
                    <p>Queretaro, Mexico</p>
                    <a href="mailto:Booking@evenxa.com.mx">Booking@evenxa.com.mx</a>
                    <a href="tel:+524461463538">446 146 3538</a>
                </div>

                <div className={styles.column}>
                    <h2>Legal</h2>
                    <a href="#">Aviso de privacidad</a>
                    <a href="#">Terminos y condiciones</a>
                </div>

                <p className={styles.copyright}>
                    2026 Evenxa. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
}
