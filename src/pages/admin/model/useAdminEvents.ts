import { useCallback, useState, type FormEvent } from "react";
import { routes } from "../../../app/router/routes";
import { adminApi, type AdminEvent } from "../../../features/admin/api";
import { eventsApi, type AddTicketTypePayload, type CreateEventPayload, type EventCategory } from "../../../features/events/api";
import { useAlerts } from "../../../shared/ui/alerts";
import type { AdminEventTicketForm } from "../ui/EventsPanel";
import { optionalNumber, optionalText, splitValues } from "./adminFormUtils";
import type { AdminPageName } from "./adminUtils";

type Params = {
    activePage: AdminPageName;
    getCurrentToken: () => string;
};

const buildAdminEventPayload = (formData: FormData, imageUrl?: string): CreateEventPayload => {
    const artistas = splitValues(String(formData.get("artistas") ?? "")).map((nombre) => ({ nombre }));
    const tags = splitValues(String(formData.get("tags") ?? ""));

    return {
        titulo: String(formData.get("titulo") ?? "").trim(),
        categoria_id: String(formData.get("categoria_id") ?? "").trim(),
        nombre_venue: String(formData.get("nombre_venue") ?? "").trim(),
        descripcion: optionalText(String(formData.get("descripcion") ?? "")),
        descripcion_corta: optionalText(String(formData.get("descripcion_corta") ?? "")),
        direccion_venue: optionalText(String(formData.get("direccion_venue") ?? "")),
        ciudad_venue: optionalText(String(formData.get("ciudad_venue") ?? "")),
        imagen_portada: imageUrl,
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

export function useAdminEvents({ activePage, getCurrentToken }: Params) {
    const alerts = useAlerts();
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
    const [eventCategoriesStatus, setEventCategoriesStatus] = useState("");
    const [isEventsLoading, setIsEventsLoading] = useState(activePage === "events");
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [eventFormResetKey, setEventFormResetKey] = useState(0);

    const loadEvents = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "events") {
            return;
        }

        setIsEventsLoading(true);

        try {
            const [eventItems, categoryItems] = await Promise.allSettled([
                adminApi.getEvents(currentToken),
                eventsApi.getCategories(),
            ]);

            if (eventItems.status === "fulfilled") {
                setEvents(eventItems.value);
            } else {
                throw eventItems.reason;
            }

            if (categoryItems.status === "fulfilled") {
                setEventCategories(categoryItems.value);
                setEventCategoriesStatus("");
            } else {
                setEventCategories([]);
                setEventCategoriesStatus(categoryItems.reason instanceof Error ? categoryItems.reason.message : "Categorías no disponibles.");
            }
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Eventos no disponibles",
                message: error instanceof Error ? error.message : "No pudimos cargar los eventos.",
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

        if (!title || !categoryId || !venueName) {
            alerts.notify({ tone: "error", title: "Datos incompletos", message: "Completa título, categoría y lugar del evento." });
            return;
        }

        if (!startsAt) {
            alerts.notify({ tone: "error", title: "Función incompleta", message: "Agrega la fecha y hora de inicio de la función." });
            return;
        }

        if (!validTickets.length) {
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
            setEventFormResetKey((current) => current + 1);
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
                title: "No pudimos crear el evento",
                message: error instanceof Error ? error.message : "Inténtalo nuevamente en unos momentos.",
            });
        } finally {
            setIsCreatingEvent(false);
        }
    };

    return {
        events,
        eventCategories,
        eventCategoriesStatus,
        isEventsLoading,
        isCreatingEvent,
        eventFormResetKey,
        loadEvents,
        handleCreateEvent,
    };
}
