import styles from "./home.module.css";
import bgImage from "../../shared/assets/images/hero/hero.jpg";
import { EventList } from "../../widgets/events/ui/EventList";

export const HomePage = () => {
    return (
        <main>
            <section
                className={styles.banner}
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className={styles.overlay} />

                <div className={styles.content}>
                    <h1>Vive la experiencia en vivo</h1>

                    <p>
                        Descubre conciertos, festivales y experiencias únicas en un solo lugar.
                    </p>

                    <div className={styles.actions}>
                        <button className="button-primary">
                            Explorar eventos
                        </button>
                    </div>
                </div>
            </section>

            {/* 👇 AQUÍ VA LA LISTA */}
            <EventList />
        </main>
    );
};