// landing.tsx

import { type MouseEvent, useEffect, useState } from "react";
import styles from "./landing.module.css";
import heroImage from "../../shared/assets/images/landing/BANNERHERO.png";
import bannerImage from "../../shared/assets/images/landing/BANNER2.png";
import fiestaMestizaImage from "../../shared/assets/images/landing/SKA LETRERO QR.png";
import alamenosImage from "../../shared/assets/images/landing/prox-alamenos.jpg";
import eventImage from "../../shared/assets/images/landing/EVENTO.jpg";
import nexoImage from "../../shared/assets/images/landing/NEXO.jpg";
import energyImage from "../../shared/assets/images/landing/ENERGIA.jpg";
import menuIcon from "../../shared/assets/icons/menu.png";
import eventIcon from "../../shared/assets/icons/landing/evento.png";
import nexoIcon from "../../shared/assets/icons/landing/nexo.png";
import energyIcon from "../../shared/assets/icons/landing/energia.png";
import facebookIcon from "../../shared/assets/icons/facebook.svg";
import instagramIcon from "../../shared/assets/icons/instagram.svg";
import tiktokIcon from "../../shared/assets/icons/tiktok.svg";
import youtubeIcon from "../../shared/assets/icons/youtube.avif";
import { kustikaMark, kustikaWordmark } from "../../shared/assets/images/logo";

const essenceCards = [
    {
        title: "Evento",
        lead: "Producción real.",
        text: "Creamos experiencias y emociones.",
        icon: eventIcon,
        image: eventImage,
    },
    {
        title: "Nexo",
        lead: "Donde todo conecta.",
        text: "Artistas, público y ambiente en perfecta sintonía.",
        icon: nexoIcon,
        image: nexoImage,
    },
    {
        title: "Energía",
        lead: "Que se vive, no se explica.",
        text: "Lo que transforma un evento en un recuerdo que se queda contigo.",
        icon: energyIcon,
        image: energyImage,
    },
];

const navLinks = [
    { label: "Inicio", path: "/inicio", sectionId: "inicio" },
    { label: "Nosotros", path: "/nosotros", sectionId: "nosotros" },
    { label: "Próximos eventos", path: "/proximos-eventos", sectionId: "proximos-eventos" },
    { label: "Contacto", path: "/contacto", sectionId: "contacto" },
];

const sectionRoutes = [
    ...navLinks,
    { label: "Fiesta Mestiza", path: "/fiesta-mestiza", sectionId: "fiesta-mestiza" },
];

const socialLinks = [
    {
        label: "Instagram",
        href: "https://www.instagram.com/kustikamx/",
        icon: instagramIcon,
    },
    {
        label: "Facebook",
        href: "https://www.facebook.com/profile.php?id=61589050558943",
        icon: facebookIcon,
    },
    {
        label: "TikTok",
        href: "https://www.tiktok.com/@kustikamx",
        icon: tiktokIcon,
    },
    {
        label: "YouTube",
        href: "https://www.youtube.com/channel/UCus_NEYv9u5LHG0SXGyqg8A",
        icon: youtubeIcon,
    },
];

export function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSectionNavigation = (
        event: MouseEvent<HTMLAnchorElement>,
        path: string,
        sectionId: string,
    ) => {
        event.preventDefault();
        window.history.pushState(null, "", path);
        scrollToSection(sectionId);
        closeMobileMenu();
    };

    useEffect(() => {
        const scrollToCurrentPath = () => {
            const currentRoute = sectionRoutes.find((route) => route.path === window.location.pathname);

            if (currentRoute) {
                window.requestAnimationFrame(() => scrollToSection(currentRoute.sectionId));
            }
        };

        scrollToCurrentPath();
        window.addEventListener("popstate", scrollToCurrentPath);

        return () => window.removeEventListener("popstate", scrollToCurrentPath);
    }, []);

    return (
        <main className={styles.page}>
            <nav className={styles.nav} aria-label="Kustika landing">
                <a
                    href="/inicio"
                    className={styles.brand}
                    aria-label="Kustika inicio"
                    onClick={(event) => handleSectionNavigation(event, "/inicio", "inicio")}
                >
                    <img src={kustikaWordmark} alt="Kustika" />
                </a>

                <div className={styles.navLinks}>
                    {navLinks.map((link) => (
                        <a
                            href={link.path}
                            key={link.path}
                            onClick={(event) => handleSectionNavigation(event, link.path, link.sectionId)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <a
                    className={styles.navCta}
                    href="/fiesta-mestiza"
                    onClick={(event) => handleSectionNavigation(event, "/fiesta-mestiza", "fiesta-mestiza")}
                >
                    Acceso anticipado
                </a>

                <button
                    className={styles.menuButton}
                    type="button"
                    aria-label="Abrir menu"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="landing-mobile-menu"
                    onClick={() => setMobileMenuOpen((open) => !open)}
                >
                    <img src={menuIcon} alt="" aria-hidden="true" />
                </button>

                <div
                    id="landing-mobile-menu"
                    className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}
                >
                    {navLinks.map((link) => (
                        <a
                            href={link.path}
                            key={link.path}
                            onClick={(event) => handleSectionNavigation(event, link.path, link.sectionId)}
                        >
                            {link.label}
                        </a>
                    ))}

                    <a
                        className={styles.mobileMenuCta}
                        href="/fiesta-mestiza"
                        onClick={(event) => handleSectionNavigation(event, "/fiesta-mestiza", "fiesta-mestiza")}
                    >
                        Acceso anticipado
                    </a>
                </div>
            </nav>

            <section
                id="inicio"
                className={styles.hero}
                style={{ backgroundImage: `url(${heroImage})` }}
            >
                <div className={styles.heroShade} />

                <div className={styles.heroContent}>
                    <h1>Vive la experiencia</h1>

                    <p>
                        Una nueva forma de vivir los eventos está comenzando.
                    </p>
                </div>

                <div className={styles.heroMark} aria-hidden="true">
                    <img src={kustikaMark} alt="" />
                </div>
            </section>

            <section
                id="fiesta-mestiza"
                className={styles.featuredEvent}
                aria-labelledby="fiesta-mestiza-title"
            >
                <div className={styles.featuredCopy}>
                    <p>Únete a</p>

                    <h2 id="fiesta-mestiza-title">Fiesta Mestiza</h2>
                </div>

                <div className={styles.featuredMedia}>
                    <img src={fiestaMestizaImage} alt="Fiesta Mestiza" />
                </div>

                <a className={styles.featuredCta} href="https://arema.mx/e/17886" target="_blank" rel="noreferrer">
                    &iexcl;Compra aquí!
                </a>
            </section>

            <section
                className={`${styles.featuredEvent} ${styles.upcomingEvent}`}
                aria-labelledby="alamenos-title"
            >
                <div className={styles.featuredCopy}>
                    <p>Muy pronto</p>

                    <h2 id="alamenos-title">Alameños</h2>
                </div>

                <div className={styles.featuredMedia}>
                    <img src={alamenosImage} alt="Próximamente: Alameños" />
                </div>

                <p className={`${styles.featuredCta} ${styles.comingSoon}`}>
                    Próximamente
                </p>
            </section>

            <section id="nosotros" className={styles.about}>
                <div className={styles.sectionTitle}>
                    <h2>Somos Kustika</h2>
                    <span />
                </div>

                <div className={styles.aboutCopy}>
                    <h3>
                        No solo organizamos eventos. Creamos el puente donde todo sucede.
                    </h3>

                    <p>
                        Nacimos para crear experiencias en vivo que conectan personas
                        a través de la música y la energía.
                    </p>
                </div>

                <div className={styles.essenceHeader}>
                    <h2>Nuestra esencia</h2>
                </div>

                <div className={styles.essenceGrid}>
                    {essenceCards.map((card) => (
                        <article
                            className={styles.essenceCard}
                            key={card.title}
                            style={{ backgroundImage: `url(${card.image})` }}
                        >
                            <div className={styles.cardShade} />

                            <div className={styles.essenceContent}>
                                <img src={card.icon} alt="" aria-hidden="true" />

                                <h3>{card.title}</h3>

                                <p className={styles.cardLead}>
                                    {card.lead}
                                </p>

                                <p>{card.text}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section id="proximos-eventos" className={styles.upcoming}>
                <h2>Tu próximo evento, con Kustika</h2>

                <div
                    className={styles.accessBand}
                    style={{ backgroundImage: `url(${bannerImage})` }}
                >
                    <div className={styles.accessShade} />

                    <div className={styles.accessCopy}>
                        <h3>Ya está sucediendo</h3>

                        <p>
                            Conoce próximos eventos de tus artistas favoritos.
                            Accede antes que nadie.
                        </p>
                    </div>
                </div>
            </section>

            <footer id="contacto" className={styles.footer}>
                <div className={styles.footerBrand}>
                    <img src={kustikaWordmark} alt="Kustika" />

                    <p>Vive la experiencia</p>

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

                <div className={styles.footerColumn}>
                    <h3>Navegación</h3>

                    {navLinks.map((link) => (
                        <a
                            href={link.path}
                            key={link.path}
                            onClick={(event) => handleSectionNavigation(event, link.path, link.sectionId)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className={styles.footerColumn}>
                    <h3>Legal</h3>

                    <a href="#">Aviso de privacidad</a>
                    <a href="#">Términos y Condiciones</a>
                </div>

                <div className={styles.footerColumn}>
                    <h3>Contacto</h3>

                    <p>Querétaro, México</p>

                    <a href="mailto:Booking@kustika.com.mx">
                        Booking@kustika.com.mx
                    </a>

                    <a href="tel:+524461463538">
                        4461463538
                    </a>
                </div>

                <p className={styles.copyright}>
                    © 2026 Kustika. Todos los derechos reservados.
                </p>
            </footer>
        </main>
    );
}



