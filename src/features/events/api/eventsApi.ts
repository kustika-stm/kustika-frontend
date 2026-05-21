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
    venue_id: string;
    descripcion?: string;
    descripcion_corta?: string;
    imagen_portada?: string;
    artistas?: Array<{ nombre: string }>;
    tags?: string[];
    edad_minima?: number;
    politicas_reembolso?: string;
    instrucciones_acceso?: string;
};

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
    descripcion?: string;
    cargo_servicio?: number;
    max_por_orden?: number;
    min_por_orden?: number;
    fecha_inicio_venta?: string;
    fecha_fin_venta?: string;
    zona?: string;
    color?: string;
    is_numerado?: boolean;
    is_transferible?: boolean;
    is_reembolsable?: boolean;
};

type ApiData<T> = {
    data: T;
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

export const eventsApi = {
    async getMyEvents(token: string) {
        const response = await apiRequest<ApiData<ManagedEvent[]> | ManagedEvent[]>("/eventos/mis-eventos", {
            method: "GET",
            token,
        });

        return unwrapData(response);
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
