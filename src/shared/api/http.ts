import { API_BASE_URL } from "./config";

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    token?: string;
};

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

export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}) {
    const headers = new Headers(options.headers);

    if (options.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (options.token) {
        headers.set("Authorization", `Bearer ${options.token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const contentType = response.headers.get("content-type");
    const responseText = response.status === 204 ? "" : await response.text();
    const data = contentType?.includes("application/json") && responseText ? JSON.parse(responseText) : responseText;

    if (!response.ok) {
        throw new ApiError(getErrorMessage(data, "No pudimos completar la solicitud."), response.status, data);
    }

    return data as TResponse;
}
