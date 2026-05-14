import { apiRequest } from "../../../shared/api";
import type { AuthSession, SessionUser } from "../../../entities/session";

export type RegisterRequest = {
    email: string;
    password: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    telefono: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type VerifyEmailRequest = {
    email: string;
    codigo: string;
};

export type ResendCodeRequest = {
    email: string;
};

export type RefreshRequest = {
    refresh_token: string;
};

type RegisterResponse = {
    usuario?: SessionUser;
    user?: SessionUser;
};

type LoginResponse = {
    data?: LoginPayload;
} & LoginPayload;

type LoginPayload = {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    usuario?: SessionUser;
    user?: SessionUser;
    tipo_usuario?: string;
};

type RefreshResponse = {
    data?: RefreshPayload;
} & RefreshPayload;

type RefreshPayload = {
    accessToken?: string;
    access_token?: string;
};

const normalizeSession = (response: LoginResponse, email: string): AuthSession => {
    const payload = response.data ?? response;
    const accessToken = payload.accessToken ?? payload.access_token;
    const refreshToken = payload.refreshToken ?? payload.refresh_token;

    if (!accessToken || !refreshToken) {
        throw new Error("El backend no regreso tokens de sesion.");
    }

    return {
        accessToken,
        refreshToken,
        user: {
            email,
            ...payload.user,
            ...payload.usuario,
            tipo_usuario: payload.tipo_usuario ?? payload.user?.tipo_usuario ?? payload.usuario?.tipo_usuario,
        },
    };
};

export const authApi = {
    register(payload: RegisterRequest) {
        return apiRequest<RegisterResponse>("/auth/register", {
            method: "POST",
            body: payload,
        });
    },

    verifyEmail(payload: VerifyEmailRequest) {
        return apiRequest<unknown>("/auth/verificar-email", {
            method: "POST",
            body: payload,
        });
    },

    resendCode(payload: ResendCodeRequest) {
        return apiRequest<unknown>("/auth/reenviar-codigo", {
            method: "POST",
            body: payload,
        });
    },

    async login(payload: LoginRequest) {
        const response = await apiRequest<LoginResponse>("/auth/login", {
            method: "POST",
            body: payload,
        });

        return normalizeSession(response, payload.email);
    },

    async refresh(request: RefreshRequest) {
        const response = await apiRequest<RefreshResponse>("/auth/refresh", {
            method: "POST",
            body: request,
        });

        const payload = response.data ?? response;
        const accessToken = payload.accessToken ?? payload.access_token;

        if (!accessToken) {
            throw new Error("El backend no regreso un accessToken nuevo.");
        }

        return accessToken;
    },

    logout(accessToken: string) {
        return apiRequest<unknown>("/auth/logout", {
            method: "POST",
            token: accessToken,
        });
    },
};
