export type UserRole = "customer" | "event_customer" | "admin" | string;

export type SessionUser = {
    id?: string;
    email: string;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    telefono?: string;
    tipo_usuario?: UserRole;
};

export type AuthSession = {
    accessToken: string;
    refreshToken: string;
    user?: SessionUser;
};
