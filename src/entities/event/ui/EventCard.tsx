import styles from "./event-card.module.css";
import type { Event } from "../model/event";
import { routes } from "../../../app/router/routes";

type Props = {
    event: Event;
};

export function EventCard({ event }: Props) {
    return (
        <a className={styles.card} href={routes.eventDetail(event.id)} aria-label={`Ver detalle de ${event.title}`}>
            <div
                className={styles.image}
                style={{ backgroundImage: `url(${event.image})` }}
            />

            <div className={styles.overlay} />

            <div className={styles.badge}>
                <span>Desde</span>
                <strong>MXN {event.price}</strong>
            </div>

            <div className={styles.content}>
                <p className={styles.location}>{event.location}</p>

                <h3>{event.title}</h3>

                <div className={styles.meta}>
                    <span>{event.date}</span>
                    <span>{event.time}</span>
                </div>
            </div>
        </a>
    );
}
