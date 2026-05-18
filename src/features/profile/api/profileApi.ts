import { normalizeRole, type SessionUser } from "../../../entities/session";
import { apiRequest } from "../../../shared/api";

type ProfileResponse = {
    data?: ProfilePayload;
} & ProfilePayload;

type ProfilePayload = SessionUser & {
    rol?: string;
    curp?: string | null;
    fecha_nacimiento?: string | null;
    email_verified?: boolean;
    is_active?: boolean;
    created_at?: string;
};

export type UpdateProfileRequest = {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    telefono: string;
};

const normalizeProfile = (response: ProfileResponse): SessionUser => {
    const payload = response.data ?? response;

    return {
        id: payload.id,
        email: payload.email,
        nombre: payload.nombre,
        apellido_paterno: payload.apellido_paterno,
        apellido_materno: payload.apellido_materno,
        telefono: payload.telefono,
        tipo_usuario: normalizeRole(payload.tipo_usuario ?? payload.rol),
    };
};

export const profileApi = {
    async getProfile(token: string) {
        const response = await apiRequest<ProfileResponse>("/usuarios/perfil", {
            method: "GET",
            token,
        });

        return normalizeProfile(response);
    },

    async updateProfile(token: string, payload: UpdateProfileRequest) {
        const response = await apiRequest<ProfileResponse>("/usuarios/actualizar-perfil", {
            method: "PUT",
            token,
            body: payload,
        });

        return normalizeProfile(response);
    },

    deleteAccount(token: string) {
        return apiRequest<unknown>("/usuarios/eliminar-cuenta", {
            method: "DELETE",
            token,
        });
    },
};
