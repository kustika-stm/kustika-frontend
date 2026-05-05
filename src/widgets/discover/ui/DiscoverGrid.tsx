import styles from "./discover-grid.module.css";
import bg from "../../../shared/assets/images/hero/hero.jpg";

export function DiscoverGrid() {
    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2>Eventos destacados</h2>
                <span>Eventos que no te puedes perder</span>
            </div>

            <div className={styles.grid}>
                {/* 1 - GRANDE ARRIBA IZQUIERDA */}
                <div
                    className={`${styles.card} ${styles.one}`}
                    style={{ backgroundImage: `url(${bg})` }}
                >
                    <div className={styles.overlay} />
                    <div className={styles.content}>
                        <span className={styles.tag}>🔥 Trending</span>
                        <h3>Midnight City Tour: Live</h3>
                    </div>
                </div>

                {/* 2 - ARRIBA DERECHA */}
                <div
                    className={`${styles.card} ${styles.two}`}
                    style={{ backgroundImage: `url(${bg})` }}
                >
                    <div className={styles.overlay} />
                    <div className={styles.content}>
                        <span className={styles.tag}>Comedy</span>
                        <h3>Late Night Laughs</h3>
                    </div>
                </div>

                {/* 3 - ABAJO IZQUIERDA */}
                <div
                    className={`${styles.card} ${styles.three}`}
                    style={{ backgroundImage: `url(${bg})` }}
                >
                    <div className={styles.overlay} />
                    <div className={styles.content}>
                        <h3>Sunset Jazz Sessions</h3>
                    </div>
                </div>

                {/* 4 - GRANDE ABAJO DERECHA */}
                <div
                    className={`${styles.card} ${styles.four}`}
                    style={{ backgroundImage: `url(${bg})` }}
                >
                    <div className={styles.overlay} />
                    <div className={styles.content}>
                        <h3>Underground Beats Vol. 4</h3>
                    </div>
                </div>
            </div>
        </section>
    );
}