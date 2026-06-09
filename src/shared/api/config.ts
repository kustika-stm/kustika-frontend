const DEFAULT_API_BASE_URL = "https://kustika-api-1084023589826.us-central1.run.app";

const getApiBaseUrl = () => {
    const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();

    return (configuredUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
};

export const API_BASE_URL = getApiBaseUrl();

export const isSecureApiBaseUrl = () => {
    return API_BASE_URL.startsWith("https://") || API_BASE_URL.startsWith("/");
};
