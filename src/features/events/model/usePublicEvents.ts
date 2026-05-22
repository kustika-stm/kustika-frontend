import { useEffect, useMemo, useState } from "react";
import type { Event, EventScheduleItem, EventTicketTier } from "../../../entities/event/model/event";
import heroImage from "../../../shared/assets/images/hero/hero.jpg";
import { eventsApi } from "../api";

type EventRecord = Record<string, unknown>;

type PublicEventsState = {
    events: Event[];
    isLoading: boolean;
    error: string;
};

type PublicEventState = {
    event: Event | null;
    isLoading: boolean;
    error: string;
};

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

const asRecord = (value: unknown): EventRecord | undefined => {
    return value && typeof value === "object" && !Array.isArray(value) ? value as EventRecord : undefined;
};

const asArray = (value: unknown): unknown[] => {
    return Array.isArray(value) ? value : [];
};

const decodeApiText = (value: string) => {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", "\"")
        .replaceAll("&#39;", "'");
};

const stringValue = (record: EventRecord, keys: string[], fallback = "") => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string" && value.trim()) {
            return decodeApiText(value.trim());
        }

        if (typeof value === "number") {
            return String(value);
        }
    }

    return fallback;
};

const numberValue = (record: EventRecord, keys: string[], fallback = 0) => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
            return Number(value);
        }
    }

    return fallback;
};

const slugify = (value: string) => {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
};

const parseDate = (value: string) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
};

const getNestedName = (record: EventRecord, key: string) => {
    const nested = asRecord(record[key]);

    return nested ? stringValue(nested, ["nombre", "name", "titulo", "title"]) : "";
};

const getEventDate = (record: EventRecord) => {
    const directDate = stringValue(record, ["fecha_inicio", "fecha", "date"]);

    if (directDate) {
        return directDate;
    }

    const functionRecord = asRecord(asArray(record.funciones)[0]);

    return functionRecord ? stringValue(functionRecord, ["fecha_inicio", "fecha", "date"]) : "";
};

const mapStatus = (status: string): Event["status"] => {
    const normalizedStatus = status.toLowerCase();

    if (["agotado", "sold-out", "sold_out"].includes(normalizedStatus)) {
        return "sold-out";
    }

    if (["proximamente", "soon", "borrador"].includes(normalizedStatus)) {
        return "soon";
    }

    return "available";
};

const getTags = (record: EventRecord) => {
    const tags = record.tags;

    if (Array.isArray(tags)) {
        return tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    if (typeof tags === "string") {
        return tags.split(/[\n,]/).map((tag) => tag.trim()).filter(Boolean);
    }

    return [];
};

const getArtists = (record: EventRecord) => {
    return asArray(record.artistas)
        .map((artist) => {
            const artistRecord = asRecord(artist);

            return artistRecord ? stringValue(artistRecord, ["nombre", "name"]) : String(artist);
        })
        .map((artist) => artist.trim())
        .filter(Boolean);
};

const getTickets = (record: EventRecord): EventTicketTier[] => {
    const functionTickets = asArray(record.funciones).flatMap((item) => {
        const functionRecord = asRecord(item);

        return functionRecord ? asArray(functionRecord.tipos_boleto) : [];
    });
    const rawTickets = [
        ...asArray(record.tipos_boleto),
        ...asArray(record.ticketTiers),
        ...asArray(record.boletos),
        ...functionTickets,
    ];

    const tickets = rawTickets
        .map((ticket, index) => {
            const ticketRecord = asRecord(ticket);

            if (!ticketRecord) {
                return null;
            }

            const name = stringValue(ticketRecord, ["nombre", "name"], `Boleto ${index + 1}`);
            const price = numberValue(ticketRecord, ["precio", "price"], 0);
            const availableQuantity = numberValue(ticketRecord, ["cantidad_disponible", "cantidad_total", "available"], 1);

            return {
                id: stringValue(ticketRecord, ["id"], slugify(name) || `ticket-${index + 1}`),
                name,
                price,
                description: stringValue(ticketRecord, ["descripcion", "description"], "Acceso al evento."),
                available: availableQuantity > 0,
            };
        })
        .filter((ticket): ticket is EventTicketTier => Boolean(ticket));

    return tickets.length ? tickets : [{
        id: "general",
        name: "General",
        price: numberValue(record, ["precio_desde", "precio", "price"], 0),
        description: "Acceso al evento.",
        available: true,
    }];
};

const getSchedule = (record: EventRecord, time: string): EventScheduleItem[] => {
    const schedule = asArray(record.funciones)
        .map((item, index) => {
            const itemRecord = asRecord(item);

            if (!itemRecord) {
                return null;
            }

            const startsAt = stringValue(itemRecord, ["fecha_inicio", "fecha", "date"]);
            const parsedDate = parseDate(startsAt);

            return {
                time: parsedDate ? timeFormatter.format(parsedDate) : stringValue(itemRecord, ["hora", "time"], time),
                label: stringValue(itemRecord, ["nombre", "name"], `Funcion ${index + 1}`),
                description: "Funcion programada del evento.",
            };
        })
        .filter((item): item is EventScheduleItem => Boolean(item));

    return schedule.length ? schedule : [{
        time,
        label: "Inicio del evento",
        description: "Consulta los detalles oficiales antes de asistir.",
    }];
};

const mapPublicEvent = (item: unknown): Event | null => {
    const record = asRecord(item);

    if (!record) {
        return null;
    }

    const id = stringValue(record, ["id", "_id", "uuid"]);
    const title = stringValue(record, ["titulo", "title", "nombre", "name"], "Evento Evenxa");
    const slug = stringValue(record, ["slug"], slugify(title) || id);
    const startsAt = getEventDate(record);
    const parsedDate = parseDate(startsAt);
    const category = getNestedName(record, "categoria") || stringValue(record, ["categoria_nombre", "categoria", "category"], "Evento");
    const venueName = stringValue(record, ["nombre_venue", "venue_nombre", "venueName", "venue"], "Venue por confirmar");
    const city = stringValue(record, ["ciudad_venue", "ciudad", "city"], "");
    const tickets = getTickets(record);
    const price = Math.min(...tickets.map((ticket) => ticket.price).filter((ticketPrice) => ticketPrice >= 0));
    const artists = getArtists(record);
    const tags = getTags(record);
    const time = parsedDate ? timeFormatter.format(parsedDate) : stringValue(record, ["hora", "time"], "Por confirmar");

    return {
        id: id || slug,
        slug: slug || id,
        title,
        subtitle: stringValue(record, ["descripcion_corta", "subtitle"], artists.length ? artists.join(", ") : category),
        description: stringValue(record, ["descripcion", "description"], "Muy pronto tendremos mas detalles de este evento."),
        location: city || venueName,
        venueName,
        address: stringValue(record, ["direccion_venue", "direccion", "address"], "Direccion por confirmar"),
        city: city || "Ciudad por confirmar",
        date: parsedDate ? monthFormatter.format(parsedDate).replace(".", "") : "Fecha por confirmar",
        time,
        price: Number.isFinite(price) ? price : 0,
        image: stringValue(record, ["imagen_portada", "imagen_url", "image", "image_url"], heroImage),
        category,
        status: mapStatus(stringValue(record, ["status", "estado"], "publicado")),
        organizer: stringValue(record, ["organizador", "organizer"], "Evenxa"),
        capacity: numberValue(record, ["capacidad", "capacity"], 0),
        tags,
        highlights: tags.length ? tags.slice(0, 3) : ["Acceso digital desde tu cuenta Evenxa"],
        schedule: getSchedule(record, time),
        ticketTiers: tickets,
        policies: [
            "El boleto digital se valida una sola vez en acceso.",
            "Consulta las indicaciones del venue antes de asistir.",
        ],
    };
};

export function usePublicEvents(): PublicEventsState {
    const [state, setState] = useState<PublicEventsState>({
        events: [],
        isLoading: true,
        error: "",
    });

    useEffect(() => {
        let isMounted = true;

        const loadEvents = async () => {
            setState((current) => ({ ...current, isLoading: true, error: "" }));

            try {
                const response = await eventsApi.getPublicEvents();
                const events = response.map(mapPublicEvent).filter((event): event is Event => Boolean(event));

                if (isMounted) {
                    setState({ events, isLoading: false, error: "" });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "No pudimos cargar los eventos.";

                if (isMounted) {
                    setState({ events: [], isLoading: false, error: message });
                }
            }
        };

        void loadEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    return useMemo(() => state, [state]);
}

export function usePublicEvent(eventId: string): PublicEventState {
    const [state, setState] = useState<PublicEventState>({
        event: null,
        isLoading: true,
        error: "",
    });

    useEffect(() => {
        let isMounted = true;

        const loadEvent = async () => {
            setState((current) => ({ ...current, isLoading: true, error: "" }));

            try {
                const response = await eventsApi.getPublicEvent(eventId);
                const event = mapPublicEvent(response);

                if (isMounted) {
                    setState({ event, isLoading: false, error: "" });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "No pudimos cargar el evento.";

                if (isMounted) {
                    setState({ event: null, isLoading: false, error: message });
                }
            }
        };

        void loadEvent();

        return () => {
            isMounted = false;
        };
    }, [eventId]);

    return useMemo(() => state, [state]);
}
