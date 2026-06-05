import type { AuthSession, SessionUser } from "./session";

export const getSessionUserPhotoUrl = (user?: Partial<SessionUser> | null) => {
    return user?.foto_url ?? user?.avatar_url ?? user?.photo_url ?? user?.picture ?? "";
};

const decodeJwtPayload = (token?: string) => {
    if (!token) {
        return null;
    }

    const [, payload] = token.split(".");

    if (!payload) {
        return null;
    }

    try {
        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
        const decodedPayload = JSON.parse(atob(paddedPayload)) as Record<string, unknown>;

        return decodedPayload;
    } catch {
        return null;
    }
};

const getPhotoFromRecord = (record?: Record<string, unknown> | null) => {
    const photo =
        record?.foto_url ??
        record?.avatar_url ??
        record?.photo_url ??
        record?.picture ??
        record?.profile_picture ??
        record?.image;

    return typeof photo === "string" ? photo : "";
};

export const getAuthSessionPhotoUrl = (session?: AuthSession | null) => {
    return getSessionUserPhotoUrl(session?.user) || getPhotoFromRecord(decodeJwtPayload(session?.accessToken));
};
