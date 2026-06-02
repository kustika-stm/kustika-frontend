import type { AdminEvent } from "../../../features/admin/api";
import { formatOptionalDate, getStatusClassName } from "../model/adminUtils";
import styles from "../admin.module.css";

type EventsPanelProps = {
    events: AdminEvent[];
    isLoading: boolean;
    publishedEvents: number;
    cancelledEvents: number;
    onRefresh: () => void;
};

export function EventsPanel({ events, isLoading, publishedEvents, cancelledEvents, onRefresh }: EventsPanelProps) {
    return (
        <>
            <section className={styles.statsGrid} aria-label="Resumen de eventos">
                <article>
                    <span>Total eventos</span>
                    <strong>{events.length}</strong>
                </article>
                <article>
                    <span>Publicados</span>
                    <strong>{publishedEvents}</strong>
                </article>
                <article>
                    <span>Cancelados</span>
                    <strong>{cancelledEvents}</strong>
                </article>
            </section>

            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div>
                        <span>Catalogo de eventos</span>
                        <h2>Eventos existentes</h2>
                    </div>
                    <button type="button" onClick={onRefresh} disabled={isLoading}>
                        {isLoading ? "Cargando" : "Actualizar"}
                    </button>
                </div>

                <div className={styles.toolbar}>
                    <p>{events.length} eventos</p>
                </div>

                <div className={styles.eventsList}>
                    {events.map((event) => (
                        <article className={styles.eventRow} key={event.id}>
                            <div className={styles.eventMain}>
                                <strong>{event.titulo}</strong>
                                <p>{[event.categoria, event.venue_nombre, event.ciudad_venue].filter(Boolean).join(" - ") || "Sin categoria o venue"}</p>
                            </div>
                            <span className={getStatusClassName(styles, event.status)}>{event.status}</span>
                            <div className={styles.eventDates}>
                                <span>Creado</span>
                                <strong>{formatOptionalDate(event.created_at)}</strong>
                            </div>
                            <div className={styles.eventDates}>
                                <span>Inicio</span>
                                <strong>{formatOptionalDate(event.fecha_inicio)}</strong>
                            </div>
                        </article>
                    ))}

                    {!isLoading && events.length === 0 && (
                        <div className={styles.emptyState}>
                            <strong>No hay eventos cargados</strong>
                            <p>Aun no encontramos eventos para mostrar en el panel.</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className={styles.emptyState}>
                            <strong>Cargando eventos</strong>
                            <p>Estamos consultando el catalogo de eventos existentes.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
