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

type AdminUsersApiResponse = {
    data: AdminUsersResponse;
};

type UpdateUserRoleResponse = {
    message: string;
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
};
