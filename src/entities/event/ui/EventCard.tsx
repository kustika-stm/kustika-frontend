import styles from "./event-card.module.css";
import type { Event } from "../model/event";

type Props = {
    event: Event;
};

export function EventCard({ event }: Props) {
    return (
        <div className={styles.card}>
            {/* Imagen */}
            <div
                className={styles.image}
                style={{ backgroundImage: `url(${event.image})` }}
            />

            {/* Overlay */}
            <div className={styles.overlay} />

            {/* Badge */}
            <div className={styles.badge}>
                <span>Desde</span>
                <strong>MXN {event.price}</strong>
            </div>

            {/* Info */}
            <div className={styles.content}>
                <p className={styles.location}>{event.location}</p>

                <h3>{event.title}</h3>

                <div className={styles.meta}>
                    <span>{event.date}</span>
                </div>
            </div>
        </div>
    );
}