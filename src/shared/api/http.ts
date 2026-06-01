import { API_BASE_URL, isSecureApiBaseUrl } from "./config";

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    token?: string;
    skipAuthRefresh?: boolean;
};

type StoredSession = {
    accessToken: string;
    refreshToken: string;
    user?: unknown;
};

type RefreshResponse = {
    data?: {
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
    };
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
};

const SESSION_STORAGE_KEY = "kustika.session";
const LEGACY_LOCAL_STORAGE_KEY = "evenxa.session";

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

const getErrorMessage = (data: unknown, fallback: string) => {
    if (data && typeof data === "object" && "message" in data) {
        return String((data as { message: unknown }).message);
    }

    if (data && typeof data === "object" && "error" in data) {
        return String((data as { error: unknown }).error);
    }

    return fallback;
};

const getStoredSession = () => {
    const rawSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession) as StoredSession;
    } catch {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
};

const saveStoredSession = (session: StoredSession) => {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const clearStoredSession = () => {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
};

const parseResponseData = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    const responseText = response.status === 204 ? "" : await response.text();

    return contentType?.includes("application/json") && responseText ? JSON.parse(responseText) : responseText;
};

const refreshAccessToken = async () => {
    const session = getStoredSession();

    if (!session?.refreshToken) {
        return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    const data = await parseResponseData(response) as RefreshResponse;

    if (!response.ok) {
        clearStoredSession();
        return null;
    }

    const payload = data.data ?? data;
    const accessToken = payload.accessToken ?? payload.access_token;
    const refreshToken = payload.refreshToken ?? payload.refresh_token ?? session.refreshToken;

    if (!accessToken) {
        clearStoredSession();
        return null;
    }

    saveStoredSession({
        ...session,
        accessToken,
        refreshToken,
    });

    return accessToken;
};

const sendRequest = (path: string, options: RequestOptions, token?: string) => {
    const { skipAuthRefresh, ...requestOptions } = options;
    const headers = new Headers(options.headers);
    const isFormDataBody = options.body instanceof FormData;

    void skipAuthRefresh;

    if (options.body !== undefined && !isFormDataBody) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        headers,
        body: options.body === undefined
            ? undefined
            : isFormDataBody
                ? options.body as BodyInit
                : JSON.stringify(options.body),
    });
};

export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}) {
    if (import.meta.env.PROD && !isSecureApiBaseUrl()) {
        throw new ApiError("La API debe usar HTTPS en produccion.", 0, null);
    }

    let response = await sendRequest(path, options, options.token);

    if (response.status === 401 && options.token && !options.skipAuthRefresh && path !== "/auth/refresh") {
        const nextAccessToken = await refreshAccessToken();

        if (nextAccessToken) {
            response = await sendRequest(path, options, nextAccessToken);
        }
    }

    const data = await parseResponseData(response);

    if (!response.ok) {
        throw new ApiError(getErrorMessage(data, "No pudimos completar la solicitud."), response.status, data);
    }

    return data as TResponse;
}
