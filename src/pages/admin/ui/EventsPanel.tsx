import { useEffect, useState, type FormEvent } from "react";
import type { AdminEvent } from "../../../features/admin/api";
import type { EventCategory } from "../../../features/events/api";
import { formatOptionalDate, getStatusClassName } from "../model/adminUtils";
import styles from "../admin.module.css";

export type AdminEventForm = {
    titulo: string;
    categoria_id: string;
    nombre_venue: string;
    direccion_venue: string;
    ciudad_venue: string;
    descripcion_corta: string;
    descripcion: string;
    imagen_portada: string;
    artistas: string;
    tags: string;
    edad_minima: string;
};

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
    allEvents: AdminEvent[];
    myEvents: AdminEvent[];
    categories: EventCategory[];
    categoriesStatus: string;
    isLoading: boolean;
    isCreatingEvent: boolean;
    isLoadingSelectedEvent: boolean;
    deletingEventId: string;
    editingEventId: string;
    eventForm: AdminEventForm;
    publishedEvents: number;
    cancelledEvents: number;
    onRefresh: () => void;
    onCreateEvent: (event: FormEvent<HTMLFormElement>, tickets: AdminEventTicketForm[]) => void;
    onEditEvent: (event: AdminEvent) => void;
    onDeleteEvent: (event: AdminEvent) => void;
    onCancelEdit: () => void;
};

type EventsSection = "catalog" | "mine";

const createEmptyTicket = (): AdminEventTicketForm => ({
    nombre: "",
    precio: "",
    cantidad_total: "",
    cargo_servicio: "",
    max_por_orden: "10",
    zona: "",
    color: "#ff66c4",
});

export const emptyAdminEventForm: AdminEventForm = {
    titulo: "",
    categoria_id: "",
    nombre_venue: "",
    direccion_venue: "",
    ciudad_venue: "",
    descripcion_corta: "",
    descripcion: "",
    imagen_portada: "",
    artistas: "",
    tags: "",
    edad_minima: "0",
};

export function EventsPanel({
    allEvents,
    myEvents,
    categories,
    categoriesStatus,
    isLoading,
    isCreatingEvent,
    isLoadingSelectedEvent,
    deletingEventId,
    editingEventId,
    eventForm,
    publishedEvents,
    cancelledEvents,
    onRefresh,
    onCreateEvent,
    onEditEvent,
    onDeleteEvent,
    onCancelEdit,
}: EventsPanelProps) {
    const [activeSection, setActiveSection] = useState<EventsSection>("catalog");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [tickets, setTickets] = useState<AdminEventTicketForm[]>([createEmptyTicket()]);
    const isEditing = Boolean(editingEventId);

    useEffect(() => {
        if (isEditing) {
            setActiveSection("mine");
            setIsFormOpen(true);
        }
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setTickets([createEmptyTicket()]);
        }
    }, [isEditing]);

    const updateTicket = (index: number, field: keyof AdminEventTicketForm, value: string) => {
        setTickets((current) => current.map((ticket, ticketIndex) => (
            ticketIndex === index ? { ...ticket, [field]: value } : ticket
        )));
    };

    const openCreateForm = () => {
        onCancelEdit();
        setTickets([createEmptyTicket()]);
        setActiveSection("mine");
        setIsFormOpen(true);
    };

    const closeForm = () => {
        onCancelEdit();
        setIsFormOpen(false);
    };

    const renderEventRows = (events: AdminEvent[], withActions = false) => (
        <div className={styles.eventsList}>
            {events.map((event) => (
                <article className={styles.eventRow} key={event.id}>
                    <div className={styles.eventMain}>
                        <strong>{event.titulo}</strong>
                        <p>{[event.categoria, event.venue_nombre, event.ciudad_venue].filter(Boolean).join(" - ") || "Sin categoria o recinto"}</p>
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
                    {withActions && (
                        <div className={styles.rowActions}>
                            <button
                                type="button"
                                onClick={() => onEditEvent(event)}
                                disabled={Boolean(deletingEventId) || isLoadingSelectedEvent}
                            >
                                {isLoadingSelectedEvent && editingEventId === event.id ? "Cargando" : "Editar"}
                            </button>
                            <button
                                type="button"
                                onClick={() => onDeleteEvent(event)}
                                disabled={Boolean(deletingEventId) || event.status.toLowerCase() === "cancelado"}
                            >
                                {deletingEventId === event.id ? "Eliminando" : event.status.toLowerCase() === "cancelado" ? "Eliminado" : "Eliminar"}
                            </button>
                        </div>
                    )}
                </article>
            ))}
        </div>
    );

    return (
        <>
            <section className={styles.statsGrid} aria-label="Resumen de eventos">
                <article>
                    <span>Total eventos</span>
                    <strong>{allEvents.length}</strong>
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
                    className={activeSection === "catalog" ? styles.activeEventsSection : undefined}
                    onClick={() => setActiveSection("catalog")}
                >
                    <span>Eventos existentes</span>
                    <strong>{allEvents.length}</strong>
                </button>
                <button
                    type="button"
                    className={activeSection === "mine" ? styles.activeEventsSection : undefined}
                    onClick={() => {
                        setActiveSection("mine");
                        setIsFormOpen(false);
                    }}
                >
                    <span>Mis eventos</span>
                    <strong>{myEvents.length}</strong>
                </button>
            </section>

            {activeSection === "catalog" && (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span>Catalogo general</span>
                            <h2>Eventos existentes</h2>
                        </div>
                        <button type="button" onClick={onRefresh} disabled={isLoading}>
                            {isLoading ? "Cargando" : "Actualizar"}
                        </button>
                    </div>

                    <div className={styles.toolbar}>
                        <p>{allEvents.length} eventos</p>
                    </div>

                    {allEvents.length ? renderEventRows(allEvents) : (
                        <div className={styles.eventsList}>
                            <div className={styles.emptyState}>
                                <strong>{isLoading ? "Cargando eventos" : "No hay eventos cargados"}</strong>
                                <p>{isLoading ? "Estamos consultando el catalogo de eventos." : "Aun no encontramos eventos para mostrar en el panel."}</p>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {activeSection === "mine" && !isFormOpen && (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span>Gestion propia</span>
                            <h2>Mis eventos</h2>
                        </div>
                        <button type="button" onClick={openCreateForm}>
                            Crear evento
                        </button>
                    </div>

                    <div className={styles.toolbar}>
                        <p>{myEvents.length} eventos propios</p>
                        <button type="button" className={styles.secondaryButton} onClick={onRefresh} disabled={isLoading}>
                            {isLoading ? "Cargando" : "Actualizar"}
                        </button>
                    </div>

                    {myEvents.length ? renderEventRows(myEvents, true) : (
                        <div className={styles.eventsList}>
                            <div className={styles.emptyState}>
                                <strong>{isLoading ? "Cargando tus eventos" : "Aun no tienes eventos"}</strong>
                                <p>{isLoading ? "Estamos consultando tus borradores y publicados." : "Crea tu primer evento con funcion y boletos para publicarlo cuando este listo."}</p>
                                {!isLoading && (
                                    <button type="button" className={styles.secondaryButton} onClick={openCreateForm}>
                                        Crear evento
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {activeSection === "mine" && isFormOpen && (
                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span>{isEditing ? "Evento seleccionado" : "Nuevo evento"}</span>
                            <h2>{isEditing ? "Editar evento" : "Crear evento como admin"}</h2>
                        </div>
                        <button type="button" onClick={closeForm} disabled={isCreatingEvent}>
                            Volver a mis eventos
                        </button>
                    </div>

                    <form className={styles.adminEventForm} onSubmit={(event) => onCreateEvent(event, tickets)}>
                        <fieldset>
                            <legend>Datos principales</legend>
                            <div className={styles.formGrid}>
                                <label>
                                    Titulo
                                    <input name="titulo" type="text" defaultValue={eventForm.titulo} required />
                                </label>

                                <label>
                                    Categoria
                                    <select name="categoria_id" defaultValue={eventForm.categoria_id} disabled={!categories.length} required>
                                        <option value="">
                                            {categories.length ? "Selecciona una categoria" : "Categorias no disponibles"}
                                        </option>
                                        {categories.map((category) => (
                                            <option value={category.id} key={category.id}>{category.nombre}</option>
                                        ))}
                                    </select>
                                    {categoriesStatus && (
                                        <span className={styles.fieldHint}>No pudimos cargar categorias: {categoriesStatus}</span>
                                    )}
                                </label>

                                <label>
                                    Lugar del evento
                                    <input name="nombre_venue" type="text" defaultValue={eventForm.nombre_venue} placeholder="Estadio, foro, salon o recinto" required />
                                </label>

                                <label>
                                    Edad minima
                                    <input name="edad_minima" type="number" min="0" defaultValue={eventForm.edad_minima} />
                                </label>

                                <label>
                                    Ciudad del recinto
                                    <input name="ciudad_venue" type="text" defaultValue={eventForm.ciudad_venue} placeholder="Queretaro" />
                                </label>

                                <label>
                                    Direccion del recinto
                                    <input name="direccion_venue" type="text" defaultValue={eventForm.direccion_venue} placeholder="Av. Torres 1000" />
                                </label>

                                <label className={styles.fullField}>
                                    Descripcion corta
                                    <input name="descripcion_corta" type="text" defaultValue={eventForm.descripcion_corta} placeholder="Resumen para tarjetas y listados" />
                                </label>

                                <label className={styles.fullField}>
                                    Descripcion
                                    <textarea name="descripcion" rows={4} defaultValue={eventForm.descripcion} />
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Imagen y contenido</legend>
                            <div className={styles.formGrid}>
                                <label>
                                    Imagen de portada
                                    <input name="imagen_portada_file" type="file" accept="image/jpeg,image/png,image/webp" />
                                    {isEditing && eventForm.imagen_portada && (
                                        <span className={styles.fieldHint}>La imagen actual se conserva si no eliges otra.</span>
                                    )}
                                </label>

                                <label>
                                    Tags
                                    <input name="tags" type="text" defaultValue={eventForm.tags} placeholder="regueton, musica" />
                                </label>

                                <label className={styles.fullField}>
                                    Artistas
                                    <textarea name="artistas" rows={3} defaultValue={eventForm.artistas} placeholder="Un artista por linea o separados por coma" />
                                </label>
                            </div>
                        </fieldset>

                        {!isEditing && (
                            <fieldset>
                                <legend>Primera funcion</legend>
                                <div className={styles.formGrid}>
                                    <label>
                                        Nombre de la funcion
                                        <input name="funcion_nombre" type="text" placeholder="Funcion viernes" />
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
                        )}

                        {!isEditing && (
                            <fieldset>
                                <div className={styles.sectionTitle}>
                                    <legend>Boletos</legend>
                                    <button type="button" onClick={() => setTickets((current) => [...current, createEmptyTicket()])}>
                                        Agregar boleto
                                    </button>
                                </div>

                                <div className={styles.ticketStack}>
                                    {tickets.map((ticket, index) => (
                                        <article className={styles.ticketCard} key={`admin-ticket-${index + 1}`}>
                                            <div className={styles.ticketHeader}>
                                                <strong>Boleto {index + 1}</strong>
                                                {tickets.length > 1 && (
                                                    <button type="button" onClick={() => setTickets((current) => current.filter((_, ticketIndex) => ticketIndex !== index))}>
                                                        Quitar
                                                    </button>
                                                )}
                                            </div>

                                            <div className={styles.formGrid}>
                                                <label>
                                                    Nombre
                                                    <input value={ticket.nombre} onChange={(event) => updateTicket(index, "nombre", event.target.value)} required={index === 0} />
                                                </label>

                                                <label>
                                                    Precio
                                                    <input type="number" min="0" step="0.01" value={ticket.precio} onChange={(event) => updateTicket(index, "precio", event.target.value)} required={index === 0} />
                                                </label>

                                                <label>
                                                    Cantidad total
                                                    <input type="number" min="1" value={ticket.cantidad_total} onChange={(event) => updateTicket(index, "cantidad_total", event.target.value)} required={index === 0} />
                                                </label>

                                                <label>
                                                    Cargo por servicio
                                                    <input type="number" min="0" step="0.01" value={ticket.cargo_servicio} onChange={(event) => updateTicket(index, "cargo_servicio", event.target.value)} />
                                                </label>

                                                <label>
                                                    Maximo por orden
                                                    <input type="number" min="1" value={ticket.max_por_orden} onChange={(event) => updateTicket(index, "max_por_orden", event.target.value)} />
                                                </label>

                                                <label>
                                                    Zona
                                                    <input value={ticket.zona} onChange={(event) => updateTicket(index, "zona", event.target.value)} placeholder="Cancha, General..." />
                                                </label>

                                                <label>
                                                    Color
                                                    <input type="color" value={ticket.color} onChange={(event) => updateTicket(index, "color", event.target.value)} />
                                                </label>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        <fieldset>
                            <legend>Publicacion</legend>
                            <label className={styles.checkboxField}>
                                <input name="publish_now" type="checkbox" />
                                {isEditing ? "Publicar despues de actualizar" : "Publicar al terminar"}
                            </label>
                        </fieldset>

                        <div className={styles.formActions}>
                            <button type="button" onClick={closeForm}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={isCreatingEvent || isLoadingSelectedEvent}>
                                {isCreatingEvent ? "Guardando..." : isEditing ? "Actualizar evento" : "Crear evento"}
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </>
    );
}
