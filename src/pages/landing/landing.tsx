import styles from "./landing.module.css";
import heroImage from "../../shared/assets/images/landing/BANNERHERO.png";
import bannerImage from "../../shared/assets/images/landing/BANNER2.png";
import eventImage from "../../shared/assets/images/landing/EVENTO.jpg";
import nexoImage from "../../shared/assets/images/landing/NEXO.jpg";
import energyImage from "../../shared/assets/images/landing/ENERGIA.jpg";
import eventIcon from "../../shared/assets/icons/landing/evento.png";
import nexoIcon from "../../shared/assets/icons/landing/nexo.png";
import energyIcon from "../../shared/assets/icons/landing/energia.png";
import facebookIcon from "../../shared/assets/icons/facebook.svg";
import instagramIcon from "../../shared/assets/icons/instagram.svg";
import tiktokIcon from "../../shared/assets/icons/tiktok.svg";
import youtubeIcon from "../../shared/assets/icons/youtube.avif";
import logo from "../../shared/assets/images/logo/logo-combinado.png";
import imagotipo from "../../shared/assets/images/logo/imagotipo.png";

const essenceCards = [
    {
        title: "Evento",
        lead: "Produccion real.",
        text: "Creamos experiencias y emociones.",
        icon: eventIcon,
        image: eventImage,
    },
    {
        title: "Nexo",
        lead: "Donde todo conecta.",
        text: "Artistas, publico y ambiente en perfecta sintonia.",
        icon: nexoIcon,
        image: nexoImage,
    },
    {
        title: "Energia",
        lead: "Que se vive, no se explica.",
        text: "Lo que transforma un evento en un recuerdo que se queda contigo.",
        icon: energyIcon,
        image: energyImage,
    },
];

const navLinks = [
    { label: "Inicio", href: "#inicio" },
    { label: "Nosotros", href: "#nosotros" },
    { label: "Proximos eventos", href: "#proximos-eventos" },
    { label: "Contacto", href: "#contacto" },
];

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

export function LandingPage() {
    return (
        <main className={styles.page}>
            <nav className={styles.nav} aria-label="Evenxa landing">
                <a href="#inicio" className={styles.brand} aria-label="Evenxa inicio">
                    <img src={logo} alt="Evenxa" />
                </a>

                <div className={styles.navLinks}>
                    {navLinks.map((link) => (
                        <a href={link.href} key={link.href}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <a className={styles.navCta} href="#proximos-eventos">
                    Acceso anticipado
                </a>
            </nav>

            <section
                id="inicio"
                className={styles.hero}
                style={{ backgroundImage: `url(${heroImage})` }}
            >
                <div className={styles.heroShade} />

                <div className={styles.heroContent}>
                    <h1>Vive la experiencia</h1>
                    <p>Una nueva forma de vivir los eventos esta comenzando.</p>
                </div>

                <div className={styles.heroMark} aria-hidden="true">
                    <img src={imagotipo} alt="" />
                </div>
            </section>

            <section id="nosotros" className={styles.about}>
                <div className={styles.sectionTitle}>
                    <h2>Somos Evenxa</h2>
                    <span />
                </div>

                <div className={styles.aboutCopy}>
                    <h3>
                        No solo organizamos eventos. Creamos el puente donde todo sucede.
                    </h3>
                    <p>
                        Nacimos para crear experiencias en vivo, que conectan personas a
                        traves de la musica y la energia.
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
                                <p className={styles.cardLead}>{card.lead}</p>
                                <p>{card.text}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section id="proximos-eventos" className={styles.upcoming}>
                <h2>Tu proximo evento, con Evenxa</h2>

                <div
                    className={styles.accessBand}
                    style={{ backgroundImage: `url(${bannerImage})` }}
                >
                    <div className={styles.accessShade} />
                    <div className={styles.accessCopy}>
                        <h3>Ya esta sucediendo</h3>
                        <p>
                            Conoce proximos eventos de tus artistas favoritos. Accede antes
                            que nadie.
                        </p>
                    </div>

                    {/*
                    <form className={styles.accessForm}>
                        <label>
                            <span>Nombre</span>
                            <input type="text" name="name" placeholder="Nombre" />
                        </label>
                        <label>
                            <span>Correo electronico</span>
                            <input
                                type="email"
                                name="email"
                                placeholder="Correo electronico"
                            />
                        </label>
                        <button type="button">Quiero enterarme primero</button>
                    </form>
                    */}
                </div>
            </section>

            <footer id="contacto" className={styles.footer}>
                <div className={styles.footerBrand}>
                    <img src={logo} alt="Evenxa" />
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
                    <h3>Navegacion</h3>
                    {navLinks.map((link) => (
                        <a href={link.href} key={link.href}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className={styles.footerColumn}>
                    <h3>Legal</h3>
                    <a href="#">Aviso de privacidad</a>
                    <a href="#">Terminos y Condiciones</a>
                </div>

                <div className={styles.footerColumn}>
                    <h3>Contacto</h3>
                    <p>Queretaro, Mexico</p>
                    <a href="mailto:contacto@evenxa.com.mx">contacto@evenxa.com.mx</a>
                </div>

                <p className={styles.copyright}>
                    © 2026 Evenxa. Todos los derechos reservados.
                </p>
            </footer>
        </main>
    );
}
