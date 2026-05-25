import { apiRequest } from "../../../shared/api";

export type EventStatus = "borrador" | "publicado" | "cancelado" | "finalizado" | string;

export type ManagedEvent = {
    id: string;
    titulo: string;
    status: EventStatus;
    categoria?: string;
    venue_nombre?: string;
    created_at?: string;
};

export type EventCategory = {
    id: string;
    nombre: string;
    slug?: string;
    icono?: string | null;
    imagen_url?: string | null;
};

export type CreateEventPayload = {
    titulo: string;
    categoria_id: string;
    nombre_venue: string;
    descripcion?: string;
    descripcion_corta?: string;
    direccion_venue?: string;
    ciudad_venue?: string;
    imagen_portada?: string;
    artistas?: Array<{ nombre: string }>;
    tags?: string[];
    edad_minima?: number;
};

export type UpdateEventPayload = Partial<CreateEventPayload> & Pick<CreateEventPayload, "titulo" | "categoria_id" | "nombre_venue">;

export type AddFunctionPayload = {
    fecha_inicio: string;
    nombre?: string;
    fecha_fin?: string;
    fecha_apertura_puertas?: string;
};

export type AddTicketTypePayload = {
    nombre: string;
    precio: number;
    cantidad_total: number;
    cargo_servicio?: number;
    max_por_orden?: number;
    zona?: string;
    color?: string;
};

type ApiData<T> = {
    data: T;
};

type UploadImageData = {
    url?: string;
};

const unwrapData = <TResponse>(response: TResponse | ApiData<TResponse>) => {
    if (response && typeof response === "object" && "data" in response) {
        return (response as ApiData<TResponse>).data;
    }

    return response as TResponse;
};

const getCreatedId = (payload: unknown, nestedKey: "evento" | "funcion") => {
    if (!payload || typeof payload !== "object") {
        return "";
    }

    const record = payload as Record<string, unknown>;

    if (typeof record.id === "string") {
        return record.id;
    }

    const nestedRecord = record[nestedKey];

    if (nestedRecord && typeof nestedRecord === "object" && "id" in nestedRecord) {
        return String((nestedRecord as { id: unknown }).id);
    }

    return "";
};

const getPublicEventsList = (payload: unknown) => {
    const data = unwrapData(payload);

    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;

        if (Array.isArray(record.eventos)) {
            return record.eventos;
        }

        if (Array.isArray(record.events)) {
            return record.events;
        }
    }

    return [];
};

export const eventsApi = {
    async getPublicEvents() {
        const response = await apiRequest<unknown>("/eventos", {
            method: "GET",
        });

        return getPublicEventsList(response);
    },

    async getPublicEvent(eventId: string) {
        const response = await apiRequest<unknown>(`/eventos/${encodeURIComponent(eventId)}`, {
            method: "GET",
        });

        return unwrapData(response);
    },

    async getManagedEvent(token: string, eventId: string) {
        const response = await apiRequest<unknown>(`/eventos/${encodeURIComponent(eventId)}`, {
            method: "GET",
            token,
        });

        return unwrapData(response);
    },

    async getMyEvents(token: string) {
        const response = await apiRequest<ApiData<ManagedEvent[]> | ManagedEvent[]>("/eventos/mis-eventos", {
            method: "GET",
            token,
        });

        return unwrapData(response);
    },

    async uploadImage(token: string, file: File) {
        const formData = new FormData();

        formData.append("imagen", file);

        const response = await apiRequest<ApiData<UploadImageData> | UploadImageData>("/uploads/imagen", {
            method: "POST",
            token,
            body: formData,
        });
        const uploadedImage = unwrapData(response);

        if (!uploadedImage.url) {
            throw new Error("El backend no regreso la URL de la imagen.");
        }

        return uploadedImage.url;
    },

    async createEvent(token: string, payload: CreateEventPayload) {
        const response = await apiRequest<unknown>("/eventos", {
            method: "POST",
            token,
            body: payload,
        });

        const createdEvent = unwrapData(response);
        const id = getCreatedId(createdEvent, "evento");

        if (!id) {
            throw new Error("El backend no regreso el ID del evento creado.");
        }

        return { id };
    },

    updateEvent(token: string, eventId: string, payload: UpdateEventPayload) {
        return apiRequest(`/eventos/${encodeURIComponent(eventId)}`, {
            method: "PUT",
            token,
            body: payload,
        });
    },

    async addFunction(token: string, eventId: string, payload: AddFunctionPayload) {
        const response = await apiRequest<unknown>(`/eventos/${eventId}/funciones`, {
            method: "POST",
            token,
            body: payload,
        });

        const createdFunction = unwrapData(response);
        const id = getCreatedId(createdFunction, "funcion");

        if (!id) {
            throw new Error("El backend no regreso el ID de la funcion creada.");
        }

        return { id };
    },

    async addTicketType(token: string, functionId: string, payload: AddTicketTypePayload) {
        return apiRequest(`/eventos/funciones/${functionId}/tipos-boleto`, {
            method: "POST",
            token,
            body: payload,
        });
    },

    publishEvent(token: string, eventId: string) {
        return apiRequest(`/eventos/${eventId}/publicar`, {
            method: "PUT",
            token,
        });
    },

    async getCategories() {
        const response = await apiRequest<ApiData<EventCategory[]>>("/categorias", {
            method: "GET",
        });

        return response.data;
    },

};
