import { useState, type FormEvent } from "react";
import type { AdminEvent } from "../../../features/admin/api";
import type { EventCategory } from "../../../features/events/api";
import { formatOptionalDate, getStatusClassName } from "../model/adminUtils";
import styles from "../admin.module.css";

export type AdminEventTicketForm = {
    nombre: string;
    precio: string;
    cantidad_total: string;
    cargo_servicio: string;
    max_por_orden: string;
    zona: string;
    color: string;
};

type EventsPanelProps = {
    events: AdminEvent[];
    categories: EventCategory[];
    categoriesStatus: string;
    isLoading: boolean;
    isCreatingEvent: boolean;
    publishedEvents: number;
    cancelledEvents: number;
    onRefresh: () => void;
    onCreateEvent: (event: FormEvent<HTMLFormElement>, tickets: AdminEventTicketForm[]) => void;
};

type EventsSection = "list" | "create";

const createEmptyTicket = (): AdminEventTicketForm => ({
    nombre: "",
    precio: "",
    cantidad_total: "",
    cargo_servicio: "",
    max_por_orden: "10",
    zona: "",
    color: "#ff66c4",
});

export function EventsPanel({
    events,
    categories,
    categoriesStatus,
    isLoading,
    isCreatingEvent,
    publishedEvents,
    cancelledEvents,
    onRefresh,
    onCreateEvent,
}: EventsPanelProps) {
    const [activeSection, setActiveSection] = useState<EventsSection>("list");
    const [tickets, setTickets] = useState<AdminEventTicketForm[]>([createEmptyTicket()]);

    const updateTicket = (index: number, field: keyof AdminEventTicketForm, value: string) => {
        setTickets((current) => current.map((ticket, ticketIndex) => (
            ticketIndex === index ? { ...ticket, [field]: value } : ticket
        )));
    };

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

            <section className={styles.eventsSwitcher} aria-label="Secciones de eventos">
                <button
                    type="button"
                    className={activeSection === "list" ? styles.activeEventsSection : undefined}
                    onClick={() => setActiveSection("list")}
                >
                    <span>Eventos existentes</span>
                    <strong>{events.length}</strong>
                </button>
                <button
                    type="button"
                    className={activeSection === "create" ? styles.activeEventsSection : undefined}
                    onClick={() => setActiveSection("create")}
                >
                    <span>Crear evento</span>
                    <strong>Admin</strong>
                </button>
            </section>

            {activeSection === "list" ? (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span>Catálogo de eventos</span>
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
                                    <p>{[event.categoria, event.venue_nombre, event.ciudad_venue].filter(Boolean).join(" - ") || "Sin categoría o recinto"}</p>
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
                                <p>Aún no encontramos eventos para mostrar en el panel.</p>
                            </div>
                        )}

                        {isLoading && (
                            <div className={styles.emptyState}>
                                <strong>Cargando eventos</strong>
                                <p>Estamos consultando el catálogo de eventos existentes.</p>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span>Nuevo evento</span>
                            <h2>Crear evento como admin</h2>
                        </div>
                    </div>

                    <form className={styles.adminEventForm} onSubmit={(event) => onCreateEvent(event, tickets)}>
                        <fieldset>
                            <legend>Datos principales</legend>
                            <div className={styles.formGrid}>
                                <label>
                                    Título
                                    <input name="titulo" type="text" required />
                                </label>

                                <label>
                                    Categoría
                                    <select name="categoria_id" disabled={!categories.length} required>
                                        <option value="">
                                            {categories.length ? "Selecciona una categoría" : "Categorías no disponibles"}
                                        </option>
                                        {categories.map((category) => (
                                            <option value={category.id} key={category.id}>{category.nombre}</option>
                                        ))}
                                    </select>
                                    {categoriesStatus && (
                                        <span className={styles.fieldHint}>No pudimos cargar categorías: {categoriesStatus}</span>
                                    )}
                                </label>

                                <label>
                                    Lugar del evento
                                    <input name="nombre_venue" type="text" placeholder="Estadio, foro, salón o recinto" required />
                                </label>

                                <label>
                                    Edad mínima
                                    <input name="edad_minima" type="number" min="0" defaultValue="0" />
                                </label>

                                <label>
                                    Ciudad del recinto
                                    <input name="ciudad_venue" type="text" placeholder="Querétaro" />
                                </label>

                                <label>
                                    Dirección del recinto
                                    <input name="direccion_venue" type="text" placeholder="Av. Torres 1000" />
                                </label>

                                <label className={styles.fullField}>
                                    Descripción corta
                                    <input name="descripcion_corta" type="text" placeholder="Resumen para tarjetas y listados" />
                                </label>

                                <label className={styles.fullField}>
                                    Descripción
                                    <textarea name="descripcion" rows={4} />
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Imagen y contenido</legend>
                            <div className={styles.formGrid}>
                                <label>
                                    Imagen de portada
                                    <input name="imagen_portada_file" type="file" accept="image/jpeg,image/png,image/webp" />
                                </label>

                                <label>
                                    Tags
                                    <input name="tags" type="text" placeholder="reguetón, música" />
                                </label>

                                <label className={styles.fullField}>
                                    Artistas
                                    <textarea name="artistas" rows={3} placeholder="Un artista por línea o separados por coma" />
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Primera función</legend>
                            <div className={styles.formGrid}>
                                <label>
                                    Nombre de la función
                                    <input name="funcion_nombre" type="text" placeholder="Función viernes" />
                                </label>

                                <label>
                                    Inicio
                                    <input name="fecha_inicio" type="datetime-local" required />
                                </label>

                                <label>
                                    Fin
                                    <input name="fecha_fin" type="datetime-local" />
                                </label>

                                <label>
                                    Apertura de puertas
                                    <input name="fecha_apertura_puertas" type="datetime-local" />
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <div className={styles.sectionTitle}>
                                <legend>Boletos</legend>
                                <button
                                    type="button"
                                    onClick={() => setTickets((current) => [...current, createEmptyTicket()])}
                                >
                                    Agregar boleto
                                </button>
                            </div>

                            <div className={styles.ticketStack}>
                                {tickets.map((ticket, index) => (
                                    <article className={styles.ticketCard} key={`admin-ticket-${index + 1}`}>
                                        <div className={styles.ticketHeader}>
                                            <strong>Boleto {index + 1}</strong>
                                            {tickets.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTickets((current) => current.filter((_, ticketIndex) => ticketIndex !== index))}
                                                >
                                                    Quitar
                                                </button>
                                            )}
                                        </div>

                                        <div className={styles.formGrid}>
                                            <label>
                                                Nombre
                                                <input
                                                    value={ticket.nombre}
                                                    onChange={(event) => updateTicket(index, "nombre", event.target.value)}
                                                    required={index === 0}
                                                />
                                            </label>

                                            <label>
                                                Precio
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={ticket.precio}
                                                    onChange={(event) => updateTicket(index, "precio", event.target.value)}
                                                    required={index === 0}
                                                />
                                            </label>

                                            <label>
                                                Cantidad total
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={ticket.cantidad_total}
                                                    onChange={(event) => updateTicket(index, "cantidad_total", event.target.value)}
                                                    required={index === 0}
                                                />
                                            </label>

                                            <label>
                                                Cargo por servicio
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={ticket.cargo_servicio}
                                                    onChange={(event) => updateTicket(index, "cargo_servicio", event.target.value)}
                                                />
                                            </label>

                                            <label>
                                                Máximo por orden
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={ticket.max_por_orden}
                                                    onChange={(event) => updateTicket(index, "max_por_orden", event.target.value)}
                                                />
                                            </label>

                                            <label>
                                                Zona
                                                <input
                                                    value={ticket.zona}
                                                    onChange={(event) => updateTicket(index, "zona", event.target.value)}
                                                    placeholder="Cancha, General..."
                                                />
                                            </label>

                                            <label>
                                                Color
                                                <input
                                                    type="color"
                                                    value={ticket.color}
                                                    onChange={(event) => updateTicket(index, "color", event.target.value)}
                                                />
                                            </label>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Publicación</legend>
                            <label className={styles.checkboxField}>
                                <input name="publish_now" type="checkbox" />
                                Publicar al terminar
                            </label>
                        </fieldset>

                        <div className={styles.formActions}>
                            <button type="submit" disabled={isCreatingEvent}>
                                {isCreatingEvent ? "Creando..." : "Crear evento"}
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </>
    );
}
