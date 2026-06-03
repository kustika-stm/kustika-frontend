import { useCallback, useState, type FormEvent } from "react";
import { routes } from "../../../app/router/routes";
import { adminApi, type AdminEvent } from "../../../features/admin/api";
import { eventsApi, type AddTicketTypePayload, type CreateEventPayload, type EventCategory } from "../../../features/events/api";
import { ApiError } from "../../../shared/api";
import { useAlerts } from "../../../shared/ui/alerts";
import { emptyAdminEventForm, type AdminEventForm, type AdminEventTicketForm } from "../ui/EventsPanel";
import { optionalNumber, optionalText, splitValues } from "./adminFormUtils";
import type { AdminPageName } from "./adminUtils";

type Params = {
    activePage: AdminPageName;
    getCurrentToken: () => string;
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

const buildAdminEventPayload = (formData: FormData, imageUrl?: string): CreateEventPayload => {
    const artistas = splitValues(String(formData.get("artistas") ?? "")).map((nombre) => ({ nombre }));
    const tags = splitValues(String(formData.get("tags") ?? ""));
    const currentImage = optionalText(String(formData.get("imagen_portada_actual") ?? ""));

    return {
        titulo: String(formData.get("titulo") ?? "").trim(),
        categoria_id: String(formData.get("categoria_id") ?? "").trim(),
        nombre_venue: String(formData.get("nombre_venue") ?? "").trim(),
        descripcion: optionalText(String(formData.get("descripcion") ?? "")),
        descripcion_corta: optionalText(String(formData.get("descripcion_corta") ?? "")),
        direccion_venue: optionalText(String(formData.get("direccion_venue") ?? "")),
        ciudad_venue: optionalText(String(formData.get("ciudad_venue") ?? "")),
        imagen_portada: imageUrl ?? currentImage,
        artistas: artistas.length ? artistas : undefined,
        tags: tags.length ? tags : undefined,
        edad_minima: optionalNumber(String(formData.get("edad_minima") ?? "")) ?? 0,
    };
};

const buildAdminTicketPayload = (ticket: AdminEventTicketForm): AddTicketTypePayload => ({
    nombre: ticket.nombre.trim(),
    precio: Number(ticket.precio),
    cantidad_total: Number(ticket.cantidad_total),
    cargo_servicio: optionalNumber(ticket.cargo_servicio),
    max_por_orden: optionalNumber(ticket.max_por_orden),
    zona: optionalText(ticket.zona),
    color: optionalText(ticket.color),
});

const asRecord = (value: unknown): Record<string, unknown> | undefined => (
    value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
);

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

const mapEventToForm = (payload: unknown, fallback?: AdminEvent): AdminEventForm => {
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
            : fallback?.ciudad_venue ?? "",
        descripcion_corta: record ? stringValue(record, ["descripcion_corta", "short_description", "subtitle"]) : "",
        descripcion: record ? stringValue(record, ["descripcion", "description"]) : "",
        imagen_portada: record ? stringValue(record, ["imagen_portada", "imagen_url", "image", "cover_image"]) : "",
        artistas,
        tags,
        edad_minima: record ? stringValue(record, ["edad_minima", "minimum_age"]) || "0" : "0",
    };
};

export function useAdminEvents({ activePage, getCurrentToken }: Params) {
    const alerts = useAlerts();
    const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);
    const [myEvents, setMyEvents] = useState<AdminEvent[]>([]);
    const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
    const [eventCategoriesStatus, setEventCategoriesStatus] = useState("");
    const [isEventsLoading, setIsEventsLoading] = useState(activePage === "events");
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [isLoadingSelectedEvent, setIsLoadingSelectedEvent] = useState(false);
    const [deletingEventId, setDeletingEventId] = useState("");
    const [editingEventId, setEditingEventId] = useState("");
    const [eventForm, setEventForm] = useState<AdminEventForm>(emptyAdminEventForm);
    const [eventFormResetKey, setEventFormResetKey] = useState(0);

    const resetEventForm = useCallback(() => {
        setEditingEventId("");
        setEventForm(emptyAdminEventForm);
        setIsLoadingSelectedEvent(false);
        setEventFormResetKey((current) => current + 1);
    }, []);

    const loadEvents = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "events") {
            return;
        }

        setIsEventsLoading(true);

        try {
            const [eventItems, categoryItems] = await Promise.allSettled([
                adminApi.getAllEvents(currentToken),
                eventsApi.getCategories(),
            ]);

            if (eventItems.status === "fulfilled") {
                setAllEvents(eventItems.value);
            } else {
                throw eventItems.reason;
            }

            try {
                setMyEvents(await adminApi.getEvents(currentToken));
            } catch (error) {
                setMyEvents([]);
                alerts.notify({
                    tone: "error",
                    title: "Mis eventos no disponibles",
                    message: getErrorMessage(error),
                });
            }

            if (categoryItems.status === "fulfilled") {
                setEventCategories(categoryItems.value);
                setEventCategoriesStatus("");
            } else {
                setEventCategories([]);
                setEventCategoriesStatus(getErrorMessage(categoryItems.reason));
            }
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Eventos no disponibles",
                message: getErrorMessage(error),
            });
        } finally {
            setIsEventsLoading(false);
        }
    }, [activePage, alerts, getCurrentToken]);

    const handleCreateEvent = async (event: FormEvent<HTMLFormElement>, tickets: AdminEventTicketForm[]) => {
        event.preventDefault();

        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);
        const title = String(formData.get("titulo") ?? "").trim();
        const categoryId = String(formData.get("categoria_id") ?? "").trim();
        const venueName = String(formData.get("nombre_venue") ?? "").trim();
        const startsAt = String(formData.get("fecha_inicio") ?? "").trim();
        const validTickets = tickets.filter((ticket) => (
            ticket.nombre.trim() && ticket.precio !== "" && ticket.cantidad_total !== ""
        ));
        const imageFile = formData.get("imagen_portada_file");
        const uploadedImageFile = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

        formData.set("imagen_portada_actual", eventForm.imagen_portada);

        if (!title || !categoryId || !venueName) {
            alerts.notify({ tone: "error", title: "Datos incompletos", message: "Completa titulo, categoria y lugar del evento." });
            return;
        }

        if (!editingEventId && !startsAt) {
            alerts.notify({ tone: "error", title: "Funcion incompleta", message: "Agrega la fecha y hora de inicio de la funcion." });
            return;
        }

        if (!editingEventId && !validTickets.length) {
            alerts.notify({
                tone: "error",
                title: "Boletos incompletos",
                message: "Agrega al menos un tipo de boleto con nombre, precio y cantidad.",
            });
            return;
        }

        setIsCreatingEvent(true);

        try {
            const uploadedImageUrl = uploadedImageFile
                ? await eventsApi.uploadImage(currentToken, uploadedImageFile)
                : undefined;

            if (editingEventId) {
                await eventsApi.updateEvent(currentToken, editingEventId, buildAdminEventPayload(formData, uploadedImageUrl));

                if (formData.get("publish_now") === "on") {
                    await eventsApi.publishEvent(currentToken, editingEventId);
                }

                await loadEvents();
                resetEventForm();
                alerts.notify({
                    tone: "success",
                    title: "Evento actualizado",
                    message: formData.get("publish_now") === "on"
                        ? "Evento actualizado y publicado correctamente."
                        : "Evento actualizado correctamente.",
                });
                return;
            }

            const createdEvent = await eventsApi.createEvent(currentToken, buildAdminEventPayload(formData, uploadedImageUrl));
            const createdFunction = await eventsApi.addFunction(currentToken, createdEvent.id, {
                fecha_inicio: startsAt,
                nombre: optionalText(String(formData.get("funcion_nombre") ?? "")),
                fecha_fin: optionalText(String(formData.get("fecha_fin") ?? "")),
                fecha_apertura_puertas: optionalText(String(formData.get("fecha_apertura_puertas") ?? "")),
            });

            await Promise.all(validTickets.map((ticket) => (
                eventsApi.addTicketType(currentToken, createdFunction.id, buildAdminTicketPayload(ticket))
            )));

            if (formData.get("publish_now") === "on") {
                await eventsApi.publishEvent(currentToken, createdEvent.id);
            }

            await loadEvents();
            form.reset();
            resetEventForm();
            alerts.notify({
                tone: "success",
                title: "Evento creado",
                message: formData.get("publish_now") === "on"
                    ? "Evento creado y publicado correctamente."
                    : "Evento guardado como borrador correctamente.",
            });
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: editingEventId ? "No pudimos actualizar el evento" : "No pudimos crear el evento",
                message: getErrorMessage(error),
            });
        } finally {
            setIsCreatingEvent(false);
        }
    };

    const handleEditEvent = async (event: AdminEvent) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        setEditingEventId(event.id);
        setEventForm(mapEventToForm(undefined, event));
        setIsLoadingSelectedEvent(true);
        setEventFormResetKey((current) => current + 1);

        try {
            const eventDetail = await eventsApi.getManagedEvent(currentToken, event.id);

            setEventForm(mapEventToForm(eventDetail, event));
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos cargar el evento",
                message: getErrorMessage(error),
            });
        } finally {
            setIsLoadingSelectedEvent(false);
            setEventFormResetKey((current) => current + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleDeleteEvent = async (event: AdminEvent) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        const shouldDelete = await alerts.confirm({
            tone: "warning",
            title: "Eliminar evento",
            message: `Esta accion quitara "${event.titulo}" del flujo activo marcandolo como cancelado.`,
            confirmLabel: "Eliminar evento",
        });

        if (!shouldDelete) {
            return;
        }

        const deleteReason = await alerts.prompt({
            tone: "warning",
            title: "Motivo de eliminacion",
            message: "Puedes agregar una nota interna para explicar la eliminacion.",
            label: "Descripcion opcional",
            placeholder: "Ej. Evento duplicado o ya no se realizara.",
            confirmLabel: "Continuar",
        });

        setDeletingEventId(event.id);

        try {
            await eventsApi.cancelEvent(currentToken, event.id, deleteReason?.trim() || undefined);
            setAllEvents((current) => current.map((item) => (
                item.id === event.id ? { ...item, status: "cancelado" } : item
            )));
            setMyEvents((current) => current.map((item) => (
                item.id === event.id ? { ...item, status: "cancelado" } : item
            )));

            if (editingEventId === event.id) {
                resetEventForm();
            }

            alerts.notify({
                tone: "success",
                title: "Evento eliminado",
                message: "Evento marcado como cancelado correctamente.",
            });
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos eliminar el evento",
                message: getErrorMessage(error),
            });
        } finally {
            setDeletingEventId("");
        }
    };

    return {
        allEvents,
        myEvents,
        eventCategories,
        eventCategoriesStatus,
        isEventsLoading,
        isCreatingEvent,
        isLoadingSelectedEvent,
        deletingEventId,
        editingEventId,
        eventForm,
        eventFormResetKey,
        loadEvents,
        handleCreateEvent,
        handleEditEvent,
        handleDeleteEvent,
        handleCancelEdit: resetEventForm,
    };
}
