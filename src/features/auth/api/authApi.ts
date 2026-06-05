import { apiRequest } from "../../../shared/api";
import { API_BASE_URL } from "../../../shared/api/config";
import { getTokenRole, normalizeRole, type AuthSession, type SessionUser } from "../../../entities/session";

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

export type RecoverPasswordRequest = {
    email: string;
};

export type VerifyResetCodeRequest = {
    email: string;
    codigo: string;
};

export type ResetPasswordRequest = VerifyResetCodeRequest & {
    nueva_password: string;
};

export type CreateGooglePasswordRequest = {
    password: string;
};

export type CreateGooglePasswordResponse = {
    message: string;
    requires_password_setup: boolean;
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
    rol?: string;
    foto_url?: string;
    avatar_url?: string;
    photo_url?: string;
    picture?: string;
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
        throw new Error("El backend no regresó tokens de sesión.");
    }

    const tokenRole = getTokenRole(accessToken);

    return {
        accessToken,
        refreshToken,
        user: {
            email,
            ...payload.user,
            ...payload.usuario,
            foto_url: payload.foto_url ?? payload.user?.foto_url ?? payload.usuario?.foto_url,
            avatar_url: payload.avatar_url ?? payload.user?.avatar_url ?? payload.usuario?.avatar_url,
            photo_url: payload.photo_url ?? payload.user?.photo_url ?? payload.usuario?.photo_url,
            picture: payload.picture ?? payload.user?.picture ?? payload.usuario?.picture,
            tipo_usuario: normalizeRole(
                payload.tipo_usuario ?? payload.rol ?? payload.user?.tipo_usuario ?? payload.usuario?.tipo_usuario ?? tokenRole,
            ),
        },
    };
};

export const authApi = {
    getGoogleLoginUrl() {
        return `${API_BASE_URL}/auth/google`;
    },

    getGoogleCallbackUrl() {
        return `${API_BASE_URL}/auth/google/callback`;
    },

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

    recoverPassword(payload: RecoverPasswordRequest) {
        return apiRequest<unknown>("/auth/recuperar-password", {
            method: "POST",
            body: payload,
        });
    },

    verifyResetCode(payload: VerifyResetCodeRequest) {
        return apiRequest<unknown>("/auth/verificar-codigo-reset", {
            method: "POST",
            body: payload,
        });
    },

    resetPassword(payload: ResetPasswordRequest) {
        return apiRequest<unknown>("/auth/reset-password", {
            method: "POST",
            body: payload,
        });
    },

    createGooglePassword(accessToken: string, payload: CreateGooglePasswordRequest) {
        return apiRequest<CreateGooglePasswordResponse>("/auth/google/crear-password", {
            method: "POST",
            token: accessToken,
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
