import { type FormEvent, useEffect, useMemo, useState } from "react";
import { routes } from "../../app/router/routes";
import { getStoredSession } from "../../entities/session";
import { eventsApi, type AddTicketTypePayload, type CreateEventPayload, type EventCategory, type ManagedEvent } from "../../features/events/api";
import { ApiError } from "../../shared/api";
import styles from "./event-customer.module.css";

type EventForm = {
    titulo: string;
    categoria_id: string;
    venue_id: string;
    descripcion_corta: string;
    descripcion: string;
    imagen_portada: string;
    artistas: string;
    tags: string;
    edad_minima: string;
    politicas_reembolso: string;
    instrucciones_acceso: string;
};

type MediaFileNames = {
    imagen_portada: string;
};

type FunctionForm = {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_apertura_puertas: string;
};

type TicketForm = {
    nombre: string;
    precio: string;
    cantidad_total: string;
    descripcion: string;
    cargo_servicio: string;
    max_por_orden: string;
    min_por_orden: string;
    fecha_inicio_venta: string;
    fecha_fin_venta: string;
    zona: string;
    color: string;
    is_numerado: boolean;
    is_transferible: boolean;
    is_reembolsable: boolean;
};

const initialEventForm: EventForm = {
    titulo: "",
    categoria_id: "",
    venue_id: "",
    descripcion_corta: "",
    descripcion: "",
    imagen_portada: "",
    artistas: "",
    tags: "",
    edad_minima: "0",
    politicas_reembolso: "",
    instrucciones_acceso: "",
};

const initialMediaFileNames: MediaFileNames = {
    imagen_portada: "",
};

const initialFunctionForm: FunctionForm = {
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    fecha_apertura_puertas: "",
};

const createEmptyTicket = (): TicketForm => ({
    nombre: "",
    precio: "",
    cantidad_total: "",
    descripcion: "",
    cargo_servicio: "",
    max_por_orden: "10",
    min_por_orden: "1",
    fecha_inicio_venta: "",
    fecha_fin_venta: "",
    zona: "",
    color: "#ff66c4",
    is_numerado: false,
    is_transferible: true,
    is_reembolsable: true,
});

const splitValues = (value: string) => {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
};

const optionalText = (value: string) => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const optionalNumber = (value: string) => {
    return value === "" ? undefined : Number(value);
};

const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
        reader.addEventListener("error", () => reject(reader.error));
        reader.readAsDataURL(file);
    });
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "No pudimos completar la accion.";
};

const buildEventPayload = (form: EventForm): CreateEventPayload => {
    const artistas = splitValues(form.artistas).map((nombre) => ({ nombre }));
    const tags = splitValues(form.tags);

    return {
        titulo: form.titulo.trim(),
        categoria_id: form.categoria_id.trim(),
        venue_id: form.venue_id.trim(),
        descripcion: optionalText(form.descripcion),
        descripcion_corta: optionalText(form.descripcion_corta),
        imagen_portada: optionalText(form.imagen_portada),
        artistas: artistas.length ? artistas : undefined,
        tags: tags.length ? tags : undefined,
        edad_minima: optionalNumber(form.edad_minima) ?? 0,
        politicas_reembolso: optionalText(form.politicas_reembolso),
        instrucciones_acceso: optionalText(form.instrucciones_acceso),
    };
};

const buildTicketPayload = (ticket: TicketForm): AddTicketTypePayload => ({
    nombre: ticket.nombre.trim(),
    precio: Number(ticket.precio),
    cantidad_total: Number(ticket.cantidad_total),
    descripcion: optionalText(ticket.descripcion),
    cargo_servicio: optionalNumber(ticket.cargo_servicio),
    max_por_orden: optionalNumber(ticket.max_por_orden),
    min_por_orden: optionalNumber(ticket.min_por_orden),
    fecha_inicio_venta: optionalText(ticket.fecha_inicio_venta),
    fecha_fin_venta: optionalText(ticket.fecha_fin_venta),
    zona: optionalText(ticket.zona),
    color: optionalText(ticket.color),
    is_numerado: ticket.is_numerado,
    is_transferible: ticket.is_transferible,
    is_reembolsable: ticket.is_reembolsable,
});

export function EventCustomerPage() {
    const [session] = useState(() => getStoredSession());
    const [eventForm, setEventForm] = useState(initialEventForm);
    const [mediaFileNames, setMediaFileNames] = useState(initialMediaFileNames);
    const [functionForm, setFunctionForm] = useState(initialFunctionForm);
    const [tickets, setTickets] = useState<TicketForm[]>([createEmptyTicket()]);
    const [publishNow, setPublishNow] = useState(false);
    const [myEvents, setMyEvents] = useState<ManagedEvent[]>([]);
    const [categories, setCategories] = useState<EventCategory[]>([]);
    const [categoriesStatus, setCategoriesStatus] = useState("");
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const token = session?.accessToken;
    const validTickets = useMemo(() => {
        return tickets.filter((ticket) => ticket.nombre.trim() && ticket.precio !== "" && ticket.cantidad_total !== "");
    }, [tickets]);

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        const loadData = async () => {
            setIsLoadingEvents(true);

            try {
                const [events, categoryItems] = await Promise.allSettled([
                    eventsApi.getMyEvents(token),
                    eventsApi.getCategories(),
                ]);

                if (!isMounted) {
                    return;
                }

                if (events.status === "fulfilled") {
                    setMyEvents(events.value);
                }

                if (categoryItems.status === "fulfilled") {
                    setCategories(categoryItems.value);
                    setCategoriesStatus("");
                } else {
                    setCategories([]);
                    setCategoriesStatus(getErrorMessage(categoryItems.reason));
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(getErrorMessage(loadError));
                }
            } finally {
                if (isMounted) {
                    setIsLoadingEvents(false);
                }
            }
        };

        void loadData();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleEventFieldChange = (field: keyof EventForm, value: string) => {
        setEventForm((current) => ({ ...current, [field]: value }));
    };

    const handleMediaFileChange = async (field: keyof MediaFileNames, file?: File) => {
        if (!file) {
            setEventForm((current) => ({ ...current, [field]: "" }));
            setMediaFileNames((current) => ({ ...current, [field]: "" }));
            return;
        }

        try {
            const dataUrl = await readFileAsDataUrl(file);

            setEventForm((current) => ({ ...current, [field]: dataUrl }));
            setMediaFileNames((current) => ({ ...current, [field]: file.name }));
        } catch {
            setError("No pudimos cargar el archivo seleccionado.");
        }
    };

    const handleFunctionFieldChange = (field: keyof FunctionForm, value: string) => {
        setFunctionForm((current) => ({ ...current, [field]: value }));
    };

    const updateTicket = (index: number, field: keyof TicketForm, value: string | boolean) => {
        setTickets((current) => current.map((ticket, ticketIndex) => (
            ticketIndex === index ? { ...ticket, [field]: value } : ticket
        )));
    };

    const resetForm = () => {
        setEventForm(initialEventForm);
        setMediaFileNames(initialMediaFileNames);
        setFunctionForm(initialFunctionForm);
        setTickets([createEmptyTicket()]);
        setPublishNow(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (!token) {
            window.location.assign(routes.login);
            return;
        }

        if (!eventForm.titulo.trim() || !eventForm.categoria_id.trim() || !eventForm.venue_id.trim()) {
            setError("Completa titulo, categoria y lugar del evento.");
            return;
        }

        if (!functionForm.fecha_inicio) {
            setError("Agrega la fecha y hora de inicio de la funcion.");
            return;
        }

        if (!validTickets.length) {
            setError("Agrega al menos un tipo de boleto con nombre, precio y cantidad.");
            return;
        }

        setIsSubmitting(true);

        try {
            const createdEvent = await eventsApi.createEvent(token, buildEventPayload(eventForm));
            const createdFunction = await eventsApi.addFunction(token, createdEvent.id, {
                fecha_inicio: functionForm.fecha_inicio,
                nombre: optionalText(functionForm.nombre),
                fecha_fin: optionalText(functionForm.fecha_fin),
                fecha_apertura_puertas: optionalText(functionForm.fecha_apertura_puertas),
            });

            await Promise.all(validTickets.map((ticket) => (
                eventsApi.addTicketType(token, createdFunction.id, buildTicketPayload(ticket))
            )));

            if (publishNow) {
                await eventsApi.publishEvent(token, createdEvent.id);
            }

            const nextEvents = await eventsApi.getMyEvents(token);
            setMyEvents(nextEvents);
            resetForm();
            setNotice(publishNow ? "Evento creado y publicado correctamente." : "Evento guardado como borrador correctamente.");
        } catch (submitError) {
            setError(getErrorMessage(submitError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span className={styles.eyebrow}>Panel de eventos</span>
                    <h1>Publica y administra tus eventos</h1>
                    <p>Crea el evento, agrega la primera funcion y configura los boletos antes de publicarlo.</p>
                </div>

                <a className={styles.secondaryAction} href={routes.profile}>Ver perfil</a>
            </section>

            <section className={styles.layout}>
                <form className={styles.panel} onSubmit={handleSubmit}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Nuevo evento</span>
                            <h2>Flujo de creacion</h2>
                        </div>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : publishNow ? "Crear y publicar" : "Guardar borrador"}
                        </button>
                    </div>

                    {notice && <div className={styles.success}>{notice}</div>}
                    {error && <div className={styles.error}>{error}</div>}

                    <fieldset className={styles.formSection}>
                        <legend>Datos principales</legend>

                        <div className={styles.formGrid}>
                            <label>
                                Titulo
                                <input
                                    value={eventForm.titulo}
                                    onChange={(event) => handleEventFieldChange("titulo", event.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Categoria
                                <select
                                    value={eventForm.categoria_id}
                                    onChange={(event) => handleEventFieldChange("categoria_id", event.target.value)}
                                    disabled={!categories.length}
                                    required
                                >
                                    <option value="">
                                        {categories.length ? "Selecciona una categoria" : "Categorias no disponibles"}
                                    </option>
                                    {categories.map((category) => (
                                        <option value={category.id} key={category.id}>{category.nombre}</option>
                                    ))}
                                </select>
                                {categoriesStatus && (
                                    <span className={styles.fieldHint}>
                                        No pudimos cargar categorias desde /categorias: {categoriesStatus}
                                    </span>
                                )}
                            </label>

                            <label>
                                Lugar del evento
                                <input
                                    value={eventForm.venue_id}
                                    onChange={(event) => handleEventFieldChange("venue_id", event.target.value)}
                                    placeholder="ID del lugar desde backend"
                                    required
                                />
                                <span className={styles.fieldHint}>
                                    Este ID debe venir del catalogo de lugares del backend.
                                </span>
                            </label>

                            <label>
                                Edad minima
                                <input
                                    type="number"
                                    min="0"
                                    value={eventForm.edad_minima}
                                    onChange={(event) => handleEventFieldChange("edad_minima", event.target.value)}
                                />
                            </label>

                            <label className={styles.fullField}>
                                Descripcion corta
                                <input
                                    value={eventForm.descripcion_corta}
                                    onChange={(event) => handleEventFieldChange("descripcion_corta", event.target.value)}
                                    placeholder="Resumen para cards y listados"
                                />
                            </label>

                            <label className={styles.fullField}>
                                Descripcion
                                <textarea
                                    rows={5}
                                    value={eventForm.descripcion}
                                    onChange={(event) => handleEventFieldChange("descripcion", event.target.value)}
                                />
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className={styles.formSection}>
                        <legend>Media y contenido</legend>

                        <div className={styles.formGrid}>
                            <label>
                                Imagen portada
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => void handleMediaFileChange("imagen_portada", event.target.files?.[0])}
                                />
                                {mediaFileNames.imagen_portada && (
                                    <span className={styles.fileSummary}>{mediaFileNames.imagen_portada}</span>
                                )}
                            </label>

                            <label>
                                Tags
                                <input
                                    value={eventForm.tags}
                                    onChange={(event) => handleEventFieldChange("tags", event.target.value)}
                                    placeholder="reggaeton, musica"
                                />
                            </label>

                            <label className={styles.fullField}>
                                Artistas
                                <textarea
                                    rows={3}
                                    value={eventForm.artistas}
                                    onChange={(event) => handleEventFieldChange("artistas", event.target.value)}
                                    placeholder="Un artista por linea o separados por coma"
                                />
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className={styles.formSection}>
                        <legend>Funcion</legend>

                        <div className={styles.formGrid}>
                            <label>
                                Nombre de funcion
                                <input
                                    value={functionForm.nombre}
                                    onChange={(event) => handleFunctionFieldChange("nombre", event.target.value)}
                                    placeholder="Funcion Viernes"
                                />
                            </label>

                            <label>
                                Inicio
                                <input
                                    type="datetime-local"
                                    value={functionForm.fecha_inicio}
                                    onChange={(event) => handleFunctionFieldChange("fecha_inicio", event.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Fin
                                <input
                                    type="datetime-local"
                                    value={functionForm.fecha_fin}
                                    onChange={(event) => handleFunctionFieldChange("fecha_fin", event.target.value)}
                                />
                            </label>

                            <label>
                                Apertura de puertas
                                <input
                                    type="datetime-local"
                                    value={functionForm.fecha_apertura_puertas}
                                    onChange={(event) => handleFunctionFieldChange("fecha_apertura_puertas", event.target.value)}
                                />
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className={styles.formSection}>
                        <div className={styles.sectionTitle}>
                            <legend>Boletos</legend>
                            <button
                                className={styles.ghostButton}
                                type="button"
                                onClick={() => setTickets((current) => [...current, createEmptyTicket()])}
                            >
                                Agregar boleto
                            </button>
                        </div>

                        <div className={styles.ticketStack}>
                            {tickets.map((ticket, index) => (
                                <div className={styles.ticketCard} key={`ticket-${index + 1}`}>
                                    <div className={styles.ticketHeader}>
                                        <strong>Boleto {index + 1}</strong>
                                        {tickets.length > 1 && (
                                            <button
                                                className={styles.removeButton}
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
                                            Cargo servicio
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={ticket.cargo_servicio}
                                                onChange={(event) => updateTicket(index, "cargo_servicio", event.target.value)}
                                            />
                                        </label>

                                        <label>
                                            Min por orden
                                            <input
                                                type="number"
                                                min="1"
                                                value={ticket.min_por_orden}
                                                onChange={(event) => updateTicket(index, "min_por_orden", event.target.value)}
                                            />
                                        </label>

                                        <label>
                                            Max por orden
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

                                        <label>
                                            Inicio venta
                                            <input
                                                type="datetime-local"
                                                value={ticket.fecha_inicio_venta}
                                                onChange={(event) => updateTicket(index, "fecha_inicio_venta", event.target.value)}
                                            />
                                        </label>

                                        <label>
                                            Fin venta
                                            <input
                                                type="datetime-local"
                                                value={ticket.fecha_fin_venta}
                                                onChange={(event) => updateTicket(index, "fecha_fin_venta", event.target.value)}
                                            />
                                        </label>

                                        <label className={styles.fullField}>
                                            Descripcion
                                            <textarea
                                                rows={3}
                                                value={ticket.descripcion}
                                                onChange={(event) => updateTicket(index, "descripcion", event.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.switches}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={ticket.is_numerado}
                                                onChange={(event) => updateTicket(index, "is_numerado", event.target.checked)}
                                            />
                                            Numerado
                                        </label>

                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={ticket.is_transferible}
                                                onChange={(event) => updateTicket(index, "is_transferible", event.target.checked)}
                                            />
                                            Transferible
                                        </label>

                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={ticket.is_reembolsable}
                                                onChange={(event) => updateTicket(index, "is_reembolsable", event.target.checked)}
                                            />
                                            Reembolsable
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className={styles.formSection}>
                        <legend>Politicas</legend>

                        <div className={styles.formGrid}>
                            <label className={styles.fullField}>
                                Politicas de reembolso
                                <textarea
                                    rows={3}
                                    value={eventForm.politicas_reembolso}
                                    onChange={(event) => handleEventFieldChange("politicas_reembolso", event.target.value)}
                                />
                            </label>

                            <label className={styles.fullField}>
                                Instrucciones de acceso
                                <textarea
                                    rows={3}
                                    value={eventForm.instrucciones_acceso}
                                    onChange={(event) => handleEventFieldChange("instrucciones_acceso", event.target.value)}
                                />
                            </label>
                        </div>

                        <label className={styles.publishToggle}>
                            <input
                                type="checkbox"
                                checked={publishNow}
                                onChange={(event) => setPublishNow(event.target.checked)}
                            />
                            Publicar al terminar
                        </label>
                    </fieldset>
                </form>

                <aside className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Mis eventos</span>
                            <h2>Eventos creados</h2>
                        </div>
                    </div>

                    {isLoadingEvents ? (
                        <div className={styles.emptyState}>
                            <strong>Cargando eventos</strong>
                            <p>Estamos consultando tus borradores y publicados.</p>
                        </div>
                    ) : myEvents.length ? (
                        <div className={styles.eventsList}>
                            {myEvents.map((event) => (
                                <article className={styles.eventItem} key={event.id}>
                                    <div>
                                        <strong>{event.titulo}</strong>
                                        <p>{[event.categoria, event.venue_nombre].filter(Boolean).join(" - ") || "Sin categoria o venue"}</p>
                                    </div>
                                    <span className={styles.statusPill}>{event.status}</span>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <strong>Aun no tienes eventos</strong>
                            <p>Crea tu primer borrador con funcion y boletos para publicarlo cuando este listo.</p>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
}
