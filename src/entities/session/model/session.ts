export type UserRole = "customer" | "event_customer" | "admin" | string;

export type SessionUser = {
    id?: string;
    email: string;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    telefono?: string;
    tipo_usuario?: UserRole;
    foto_url?: string;
    avatar_url?: string;
    photo_url?: string;
    picture?: string;
    requiresPasswordSetup?: boolean;
};

export type AuthSession = {
    accessToken: string;
    refreshToken: string;
    user?: SessionUser;
};
