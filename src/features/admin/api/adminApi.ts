import { apiRequest } from "../../../shared/api";

export type AdminUserRole = "customer" | "event_manager" | "admin";

export type AdminUser = {
    id: string;
    email: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    telefono: string;
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
    rol: AdminUserRole;
};

export type AdminUsersResponse = {
    usuarios: AdminUser[];
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export type AdminEvent = {
    id: string;
    titulo: string;
    status: string;
    categoria?: string;
    venue_nombre?: string;
    ciudad_venue?: string;
    created_at?: string;
    fecha_inicio?: string;
};

type AdminUsersApiResponse = {
    data: AdminUsersResponse;
};

type UpdateUserRoleResponse = {
    message: string;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => (
    value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
);

const unwrapData = (payload: unknown) => {
    const record = asRecord(payload);

    return record && "data" in record ? record.data : payload;
};

const getArrayPayload = (payload: unknown) => {
    const data = unwrapData(payload);

    if (Array.isArray(data)) {
        return data;
    }

    const record = asRecord(data);

    if (!record) {
        return [];
    }

    if (Array.isArray(record.eventos)) {
        return record.eventos;
    }

    if (Array.isArray(record.events)) {
        return record.events;
    }

    return [];
};

const mergeRecords = (summary: unknown, detail: unknown) => {
    const summaryRecord = asRecord(summary);
    const detailRecord = asRecord(unwrapData(detail));

    if (!summaryRecord) {
        return detailRecord ?? detail;
    }

    if (!detailRecord) {
        return summary;
    }

    return {
        ...summaryRecord,
        ...detailRecord,
    };
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

const nestedName = (record: Record<string, unknown>, key: string) => {
    const nested = asRecord(record[key]);

    return nested ? stringValue(nested, ["nombre", "name", "titulo", "title"]) : "";
};

const asArray = (value: unknown) => Array.isArray(value) ? value : [];

const getFunctionRecords = (record: Record<string, unknown>) => {
    const fromArrays = [
        ...asArray(record.funciones),
        ...asArray(record.functions),
        ...asArray(record.horarios),
    ];
    const fromSingles = [
        asRecord(record.funcion),
        asRecord(record.function),
        asRecord(record.proxima_funcion),
        asRecord(record.nextFunction),
    ].filter((item): item is Record<string, unknown> => Boolean(item));

    return [...fromArrays, ...fromSingles]
        .map(asRecord)
        .filter((item): item is Record<string, unknown> => Boolean(item));
};

const getEventStartDate = (record: Record<string, unknown>) => {
    const directDate = stringValue(record, ["fecha_inicio", "fecha", "date", "starts_at", "startDate"]);

    if (directDate) {
        return directDate;
    }

    const functionRecord = getFunctionRecords(record)[0];

    return functionRecord ? stringValue(functionRecord, ["fecha_inicio", "fecha", "date", "starts_at", "startDate"]) : "";
};

const mapAdminEvent = (item: unknown): AdminEvent | null => {
    const record = asRecord(item);

    if (!record) {
        return null;
    }

    const titulo = stringValue(record, ["titulo", "title", "nombre", "name"]);
    const id = stringValue(record, ["id", "_id", "uuid"]);

    if (!id && !titulo) {
        return null;
    }

    return {
        id: id || titulo,
        titulo: titulo || "Evento sin titulo",
        status: stringValue(record, ["status", "estado"]) || "sin estado",
        categoria: nestedName(record, "categoria") || stringValue(record, ["categoria", "categoria_nombre", "category"]),
        venue_nombre: nestedName(record, "venue") || stringValue(record, ["venue_nombre", "nombre_venue", "venueName", "venue"]),
        ciudad_venue: stringValue(record, ["ciudad_venue", "ciudad", "city"]),
        created_at: stringValue(record, ["created_at", "createdAt"]),
        fecha_inicio: getEventStartDate(record),
    };
};

const hydrateAdminEvents = async (events: unknown[], token: string) => {
    return Promise.all(events.map(async (event) => {
        const record = asRecord(event);
        const eventId = record ? stringValue(record, ["id", "_id", "uuid"]) : "";

        if (!eventId) {
            return event;
        }

        try {
            const detail = await apiRequest<unknown>(`/eventos/${encodeURIComponent(eventId)}`, {
                method: "GET",
                token,
            });

            return mergeRecords(event, detail);
        } catch {
            return event;
        }
    }));
};

export const adminApi = {
    async getUsers(token: string, page: number, limit: number) {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });

        const response = await apiRequest<AdminUsersApiResponse>(`/admin/usuarios?${params.toString()}`, {
            method: "GET",
            token,
        });

        return response.data;
    },

    updateUserRole(token: string, userId: string, rol: AdminUserRole) {
        return apiRequest<UpdateUserRoleResponse>(`/admin/usuarios/${userId}/rol`, {
            method: "PUT",
            token,
            body: { rol },
        });
    },

    async getEvents(token: string) {
        const response = await apiRequest<unknown>("/eventos/mis-eventos", {
            method: "GET",
            token,
        });
        const hydratedEvents = await hydrateAdminEvents(getArrayPayload(response), token);

        return hydratedEvents.map(mapAdminEvent).filter((event): event is AdminEvent => Boolean(event));
    },
};
