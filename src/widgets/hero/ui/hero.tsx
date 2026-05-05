import styles from "./hero.module.css";
import bgImage from "../../../shared/assets/images/hero/hero.jpg";

export function Hero() {
    return (
        <section className={styles.wrapper}>
            <div
                className={styles.banner}
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className={styles.overlay} />

                <div className={styles.content}>
                    <span className={styles.badge}>
                        Featured event
                    </span>

                    <h1>Vive la experiencia en vivo</h1>

                    <p>
                        Conciertos, festivales y experiencias únicas en un solo lugar.
                    </p>

                    <div className={styles.actions}>
                        <button className="button-primary">
                            Explorar eventos
                        </button>

                        <button className={styles.secondary}>
                            Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}