import { type FormEvent, useEffect, useMemo, useState } from "react";
import { routes } from "../../app/router/routes";
import { getStoredSession } from "../../entities/session";
import { eventsApi, type AddTicketTypePayload, type CreateEventPayload, type EventCategory, type ManagedEvent } from "../../features/events/api";
import { ApiError } from "../../shared/api";
import styles from "./event-customer.module.css";

type EventForm = {
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

type MediaFileNames = {
    imagen_portada: string;
};

type MediaFiles = {
    imagen_portada?: File;
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
    cargo_servicio: string;
    max_por_orden: string;
    zona: string;
    color: string;
};

const initialEventForm: EventForm = {
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
    cargo_servicio: "",
    max_por_orden: "10",
    zona: "",
    color: "#ff66c4",
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

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "No pudimos completar la accion.";
};

const buildEventPayload = (form: EventForm, imageUrl?: string): CreateEventPayload => {
    const artistas = splitValues(form.artistas).map((nombre) => ({ nombre }));
    const tags = splitValues(form.tags);

    return {
        titulo: form.titulo.trim(),
        categoria_id: form.categoria_id.trim(),
        nombre_venue: form.nombre_venue.trim(),
        descripcion: optionalText(form.descripcion),
        descripcion_corta: optionalText(form.descripcion_corta),
        direccion_venue: optionalText(form.direccion_venue),
        ciudad_venue: optionalText(form.ciudad_venue),
        imagen_portada: imageUrl ?? optionalText(form.imagen_portada),
        artistas: artistas.length ? artistas : undefined,
        tags: tags.length ? tags : undefined,
        edad_minima: optionalNumber(form.edad_minima) ?? 0,
    };
};

const buildTicketPayload = (ticket: TicketForm): AddTicketTypePayload => ({
    nombre: ticket.nombre.trim(),
    precio: Number(ticket.precio),
    cantidad_total: Number(ticket.cantidad_total),
    cargo_servicio: optionalNumber(ticket.cargo_servicio),
    max_por_orden: optionalNumber(ticket.max_por_orden),
    zona: optionalText(ticket.zona),
    color: optionalText(ticket.color),
});

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : undefined;
};

const stringValue = (record: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }
    }

    return "";
};

const nestedRecord = (record: Record<string, unknown>, key: string) => asRecord(record[key]);

const getEventRecord = (payload: unknown) => {
    const record = asRecord(payload);

    if (!record) {
        return undefined;
    }

    return nestedRecord(record, "evento") ?? nestedRecord(record, "event") ?? record;
};

const mapEventToForm = (payload: unknown, fallback?: ManagedEvent): EventForm => {
    const record = getEventRecord(payload);
    const categoria = record ? nestedRecord(record, "categoria") : undefined;
    const venue = record ? nestedRecord(record, "venue") : undefined;
    const tagsValue = record?.tags;
    const artistasValue = record?.artistas ?? record?.artists;

    const tags = Array.isArray(tagsValue)
        ? tagsValue.map((tag) => String(tag)).join(", ")
        : record ? stringValue(record, ["tags"]) : "";
    const artistas = Array.isArray(artistasValue)
        ? artistasValue.map((artist) => {
            const artistRecord = asRecord(artist);

            return artistRecord ? stringValue(artistRecord, ["nombre", "name"]) : String(artist);
        }).filter(Boolean).join("\n")
        : record ? stringValue(record, ["artistas", "artists"]) : "";

    return {
        titulo: record ? stringValue(record, ["titulo", "title", "nombre", "name"]) : fallback?.titulo ?? "",
        categoria_id: record
            ? stringValue(record, ["categoria_id", "category_id"]) || (categoria ? stringValue(categoria, ["id"]) : "")
            : "",
        nombre_venue: record
            ? stringValue(record, ["nombre_venue", "venue_nombre", "venueName"]) || (venue ? stringValue(venue, ["nombre", "name"]) : "")
            : fallback?.venue_nombre ?? "",
        direccion_venue: record
            ? stringValue(record, ["direccion_venue", "venue_direccion", "address"]) || (venue ? stringValue(venue, ["direccion", "address"]) : "")
            : "",
        ciudad_venue: record
            ? stringValue(record, ["ciudad_venue", "venue_ciudad", "city"]) || (venue ? stringValue(venue, ["ciudad", "city"]) : "")
            : "",
        descripcion_corta: record ? stringValue(record, ["descripcion_corta", "short_description", "subtitle"]) : "",
        descripcion: record ? stringValue(record, ["descripcion", "description"]) : "",
        imagen_portada: record ? stringValue(record, ["imagen_portada", "imagen_url", "image", "cover_image"]) : "",
        artistas,
        tags,
        edad_minima: record ? stringValue(record, ["edad_minima", "minimum_age"]) || "0" : "0",
    };
};

export function EventCustomerPage() {
    const [session] = useState(() => getStoredSession());
    const [eventForm, setEventForm] = useState(initialEventForm);
    const [mediaFiles, setMediaFiles] = useState<MediaFiles>({});
    const [mediaFileNames, setMediaFileNames] = useState(initialMediaFileNames);
    const [functionForm, setFunctionForm] = useState(initialFunctionForm);
    const [tickets, setTickets] = useState<TicketForm[]>([createEmptyTicket()]);
    const [publishNow, setPublishNow] = useState(false);
    const [myEvents, setMyEvents] = useState<ManagedEvent[]>([]);
    const [categories, setCategories] = useState<EventCategory[]>([]);
    const [categoriesStatus, setCategoriesStatus] = useState("");
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [editingEventId, setEditingEventId] = useState("");
    const [isLoadingSelectedEvent, setIsLoadingSelectedEvent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const token = session?.accessToken;
    const isEditing = Boolean(editingEventId);
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

    const handleMediaFileChange = (field: keyof MediaFileNames, file?: File) => {
        if (!file) {
            setEventForm((current) => ({ ...current, [field]: "" }));
            setMediaFiles((current) => ({ ...current, [field]: undefined }));
            setMediaFileNames((current) => ({ ...current, [field]: "" }));
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            setMediaFiles((current) => ({ ...current, [field]: undefined }));
            setMediaFileNames((current) => ({ ...current, [field]: "" }));
            setError("La imagen debe ser JPG, PNG o WEBP.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setMediaFiles((current) => ({ ...current, [field]: undefined }));
            setMediaFileNames((current) => ({ ...current, [field]: "" }));
            setError("La imagen debe pesar 5MB o menos.");
            return;
        }

        setError("");
        setEventForm((current) => ({ ...current, [field]: "" }));
        setMediaFiles((current) => ({ ...current, [field]: file }));
        setMediaFileNames((current) => ({ ...current, [field]: file.name }));
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
        setMediaFiles({});
        setMediaFileNames(initialMediaFileNames);
        setFunctionForm(initialFunctionForm);
        setTickets([createEmptyTicket()]);
        setPublishNow(false);
        setEditingEventId("");
        setIsLoadingSelectedEvent(false);
    };

    const handleEditEvent = async (managedEvent: ManagedEvent) => {
        setError("");
        setNotice("");
        setEditingEventId(managedEvent.id);
        setIsLoadingSelectedEvent(true);
        setMediaFiles({});
        setMediaFileNames(initialMediaFileNames);
        setPublishNow(false);

        try {
            const eventDetail = token
                ? await eventsApi.getManagedEvent(token, managedEvent.id)
                : await eventsApi.getPublicEvent(managedEvent.id);

            setEventForm(mapEventToForm(eventDetail, managedEvent));
        } catch (loadError) {
            setEventForm(mapEventToForm(undefined, managedEvent));
            setError(getErrorMessage(loadError));
        } finally {
            setIsLoadingSelectedEvent(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (!token) {
            window.location.assign(routes.login);
            return;
        }

        if (!eventForm.titulo.trim() || !eventForm.categoria_id.trim() || !eventForm.nombre_venue.trim()) {
            setError("Completa titulo, categoria y lugar del evento.");
            return;
        }

        if (!isEditing && !functionForm.fecha_inicio) {
            setError("Agrega la fecha y hora de inicio de la funcion.");
            return;
        }

        if (!isEditing && !validTickets.length) {
            setError("Agrega al menos un tipo de boleto con nombre, precio y cantidad.");
            return;
        }

        setIsSubmitting(true);

        try {
            const uploadedImageUrl = mediaFiles.imagen_portada
                ? await eventsApi.uploadImage(token, mediaFiles.imagen_portada)
                : undefined;

            if (isEditing) {
                await eventsApi.updateEvent(token, editingEventId, buildEventPayload(eventForm, uploadedImageUrl));

                if (publishNow) {
                    await eventsApi.publishEvent(token, editingEventId);
                }

                const nextEvents = await eventsApi.getMyEvents(token);
                setMyEvents(nextEvents);
                resetForm();
                setNotice(publishNow ? "Evento actualizado y publicado correctamente." : "Evento actualizado correctamente.");
                return;
            }

            const createdEvent = await eventsApi.createEvent(token, buildEventPayload(eventForm, uploadedImageUrl));
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
                            <span className={styles.eyebrow}>{isEditing ? "Evento seleccionado" : "Nuevo evento"}</span>
                            <h2>{isEditing ? "Editar evento" : "Flujo de creacion"}</h2>
                        </div>
                        <div className={styles.headerActions}>
                            {isEditing && (
                                <button className={styles.neutralButton} type="button" onClick={resetForm} disabled={isSubmitting}>
                                    Cancelar
                                </button>
                            )}
                            <button type="submit" disabled={isSubmitting || isLoadingSelectedEvent}>
                                {isSubmitting
                                    ? "Guardando..."
                                    : isEditing
                                        ? "Actualizar evento"
                                        : publishNow ? "Crear y publicar" : "Guardar borrador"}
                            </button>
                        </div>
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
                                    value={eventForm.nombre_venue}
                                    onChange={(event) => handleEventFieldChange("nombre_venue", event.target.value)}
                                    placeholder="Estadio, foro, salon o recinto"
                                    required
                                />
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

                            <label>
                                Ciudad del venue
                                <input
                                    value={eventForm.ciudad_venue}
                                    onChange={(event) => handleEventFieldChange("ciudad_venue", event.target.value)}
                                    placeholder="Queretaro"
                                />
                            </label>

                            <label>
                                Direccion del venue
                                <input
                                    value={eventForm.direccion_venue}
                                    onChange={(event) => handleEventFieldChange("direccion_venue", event.target.value)}
                                    placeholder="Av. Torres 1000"
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
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) => handleMediaFileChange("imagen_portada", event.target.files?.[0])}
                                />
                                {mediaFileNames.imagen_portada && (
                                    <span className={styles.fileSummary}>{mediaFileNames.imagen_portada}</span>
                                )}
                                {isEditing && eventForm.imagen_portada && !mediaFileNames.imagen_portada && (
                                    <span className={styles.fileSummary}>Imagen actual conservada</span>
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

                    {!isEditing && (
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
                    )}

                    {!isEditing && (
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

                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>
                    )}

                    <fieldset className={styles.formSection}>
                        <legend>Publicacion</legend>

                        <label className={styles.publishToggle}>
                            <input
                                type="checkbox"
                                checked={publishNow}
                                onChange={(event) => setPublishNow(event.target.checked)}
                            />
                            {isEditing ? "Publicar despues de actualizar" : "Publicar al terminar"}
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
                                    <div className={styles.eventActions}>
                                        <span className={styles.statusPill}>{event.status}</span>
                                        <button type="button" onClick={() => void handleEditEvent(event)}>
                                            Editar
                                        </button>
                                    </div>
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
