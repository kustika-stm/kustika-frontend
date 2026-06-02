import { routes } from "../../../app/router/routes";
import bgImage from "../../../shared/assets/images/hero/hero.jpg";
import styles from "./hero.module.css";

export function Hero() {
    return (
        <section className={styles.wrapper}>
            <div
                className={styles.banner}
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className={styles.overlay} />

                <div className={styles.content}>
                    <span className={styles.badge}>Eventos en vivo</span>

                    <h1>Encuentra la noche que vas a recordar</h1>

                    <p>
                        Conciertos, festivales y experiencias unicas seleccionadas para moverte por la ciudad.
                    </p>

                    <div className={styles.actions}>
                        <a className={styles.primary} href={routes.events}>
                            Explorar eventos
                        </a>

                        <a className={styles.secondary} href={routes.categories}>
                            Ver categorías
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
