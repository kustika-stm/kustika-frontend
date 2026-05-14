export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV ? "/api" : "https://evenxa-api-976401550096.us-central1.run.app");
