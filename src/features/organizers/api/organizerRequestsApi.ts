import { apiRequest } from "../../../shared/api";

export type OrganizerRequestStatus = "pendiente" | "aprobada" | "rechazada";

export type OrganizerRequest = {
    id: string;
    nombre_empresa: string;
    rfc: string;
    status: OrganizerRequestStatus;
    email: string;
    nombre: string;
    apellido_paterno: string;
    created_at: string;
};

type OrganizerRequestsResponse = {
    data: OrganizerRequest[];
};

type OrganizerRequestResponse = {
    data: OrganizerRequest | null;
};

type MessageResponse = {
    message: string;
};

export type CreateOrganizerRequestPayload = {
    nombre_empresa: string;
    rfc: string;
};

export const organizerRequestsApi = {
    async getRequests(token: string, status?: OrganizerRequestStatus | "todos") {
        const params = status && status !== "todos"
            ? `?${new URLSearchParams({ status }).toString()}`
            : "";
        const response = await apiRequest<OrganizerRequestsResponse>(`/organizadores/solicitudes${params}`, {
            method: "GET",
            token,
        });

        return response.data;
    },

    async getMyRequest(token: string) {
        const response = await apiRequest<OrganizerRequestResponse>("/organizadores/mi-solicitud", {
            method: "GET",
            token,
        });

        return response.data;
    },

    createRequest(token: string, payload: CreateOrganizerRequestPayload) {
        return apiRequest<MessageResponse>("/organizadores/solicitar", {
            method: "POST",
            token,
            body: payload,
        });
    },

    approveRequest(token: string, requestId: string) {
        return apiRequest<MessageResponse>(`/organizadores/solicitudes/${requestId}/aprobar`, {
            method: "PUT",
            token,
        });
    },

    rejectRequest(token: string, requestId: string, motivo: string) {
        return apiRequest<MessageResponse>(`/organizadores/solicitudes/${requestId}/rechazar`, {
            method: "PUT",
            token,
            body: { motivo },
        });
    },
};
