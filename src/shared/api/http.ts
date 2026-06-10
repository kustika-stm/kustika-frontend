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
    technicalMessage?: string;

    constructor(message: string, status: number, data: unknown, technicalMessage?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
        this.technicalMessage = technicalMessage;
    }
}

const getBackendErrorMessage = (data: unknown) => {
    if (data && typeof data === "object" && "message" in data) {
        return String((data as { message: unknown }).message);
    }

    if (data && typeof data === "object" && "error" in data) {
        return String((data as { error: unknown }).error);
    }

    return "";
};

const normalizeMessage = (message: string) => {
    return message
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

const getKnownUserMessage = (message: string) => {
    const normalizedMessage = normalizeMessage(message);

    if (/credential|contrasena incorrect|password incorrect|invalid password|usuario o contrasena/.test(normalizedMessage)) {
        return "El correo o la contraseña no son correctos.";
    }

    if (/email.*(exist|registr)|correo.*(exist|registr)|user already exists|duplicate.*email/.test(normalizedMessage)) {
        return "Ya existe una cuenta con ese correo.";
    }

    if (/codigo.*(expir|venc)|code.*expir/.test(normalizedMessage)) {
        return "El código venció. Solicita uno nuevo para continuar.";
    }

    if (/codigo.*(invalid|incorrect)|invalid.*code/.test(normalizedMessage)) {
        return "El código no es válido. Revísalo e inténtalo nuevamente.";
    }

    if (/token.*(expir|invalid)|jwt.*(expir|invalid)|sesion.*(expir|venc)/.test(normalizedMessage)) {
        return "Tu sesión venció. Inicia sesión nuevamente.";
    }

    if (/not found|no encontrado|no existe/.test(normalizedMessage)) {
        return "No encontramos la información solicitada.";
    }

    if (/forbidden|permission|permiso|unauthorized|no autorizado/.test(normalizedMessage)) {
        return "No tienes permiso para realizar esta acción.";
    }

    if (/too many|rate limit|demasiad.*solicitud/.test(normalizedMessage)) {
        return "Hiciste varios intentos seguidos. Espera un momento y vuelve a intentarlo.";
    }

    return "";
};

const getStatusUserMessage = (status: number) => {
    if (status === 0) {
        return "No pudimos conectarnos con el servicio. Revisa tu conexión e inténtalo nuevamente.";
    }

    if (status === 400 || status === 422) {
        return "Revisa la información ingresada e inténtalo nuevamente.";
    }

    if (status === 401) {
        return "Tu sesión no es válida. Inicia sesión nuevamente.";
    }

    if (status === 403) {
        return "No tienes permiso para realizar esta acción.";
    }

    if (status === 404) {
        return "No encontramos la información solicitada.";
    }

    if (status === 409) {
        return "La información ya existe o entra en conflicto con otro registro.";
    }

    if (status === 413) {
        return "El archivo es demasiado pesado. Intenta con uno más pequeño.";
    }

    if (status === 429) {
        return "Hiciste varios intentos seguidos. Espera un momento y vuelve a intentarlo.";
    }

    if (status >= 500) {
        return "El servicio tuvo un problema. Inténtalo nuevamente en unos momentos.";
    }

    return "No pudimos completar la solicitud. Inténtalo nuevamente.";
};

const createApiError = (status: number, data: unknown) => {
    const technicalMessage = getBackendErrorMessage(data);
    const message = getKnownUserMessage(technicalMessage) || getStatusUserMessage(status);

    return new ApiError(message, status, data, technicalMessage || undefined);
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
        throw new ApiError(getStatusUserMessage(0), 0, null, "La API debe usar HTTPS en produccion.");
    }

    let response: Response;

    try {
        response = await sendRequest(path, options, options.token);
    } catch (error) {
        const technicalMessage = error instanceof Error ? error.message : "Network request failed";

        throw new ApiError(getStatusUserMessage(0), 0, null, technicalMessage);
    }

    if (response.status === 401 && options.token && !options.skipAuthRefresh && path !== "/auth/refresh") {
        let nextAccessToken: string | null;

        try {
            nextAccessToken = await refreshAccessToken();
        } catch (error) {
            const technicalMessage = error instanceof Error ? error.message : "Session refresh failed";

            throw new ApiError(getStatusUserMessage(0), 0, null, technicalMessage);
        }

        if (nextAccessToken) {
            try {
                response = await sendRequest(path, options, nextAccessToken);
            } catch (error) {
                const technicalMessage = error instanceof Error ? error.message : "Network retry failed";

                throw new ApiError(getStatusUserMessage(0), 0, null, technicalMessage);
            }
        }
    }

    let data: unknown;

    try {
        data = await parseResponseData(response);
    } catch (error) {
        const technicalMessage = error instanceof Error ? error.message : "Invalid API response";

        throw new ApiError(
            "Recibimos una respuesta inesperada del servicio. Inténtalo nuevamente.",
            response.status,
            null,
            technicalMessage,
        );
    }

    if (!response.ok) {
        throw createApiError(response.status, data);
    }

    return data as TResponse;
}
