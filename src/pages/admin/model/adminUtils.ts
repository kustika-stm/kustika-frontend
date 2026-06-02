import type { AdminUser } from "../../../features/admin/api";
import type { OrganizerRequestStatus } from "../../../features/organizers/api";
import type { RaffleStatus } from "../../../entities/raffle";

export type AdminPageName = "users" | "events" | "raffles" | "requests" | "profile";

export const roleOptions = [
    { value: "customer", label: "Customer" },
    { value: "event_manager", label: "Event manager" },
    { value: "admin", label: "Admin" },
] as const;

export const usersPerPage = 10;

export const requestStatusOptions: Array<{ value: OrganizerRequestStatus | "todos"; label: string }> = [
    { value: "todos", label: "Todas" },
    { value: "pendiente", label: "Pendientes" },
    { value: "aprobada", label: "Aprobadas" },
    { value: "rechazada", label: "Rechazadas" },
];

export const raffleStatusOptions: Array<{ value: RaffleStatus; label: string }> = [
    { value: "trending", label: "En tendencia" },
    { value: "limited", label: "Limitada" },
    { value: "hot", label: "Popular" },
    { value: "rare", label: "Especial" },
];

export const getFullName = (user: AdminUser) =>
    [user.nombre, user.apellido_paterno, user.apellido_materno].filter(Boolean).join(" ") || "Sin nombre";

export const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));

export const formatOptionalDate = (value?: string) => {
    if (!value) {
        return "Sin fecha";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : formatDate(value);
};

export const getStatusClassName = (styles: Record<string, string>, status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "publicado") {
        return styles.publishedStatus;
    }

    if (normalizedStatus === "borrador") {
        return styles.draftStatus;
    }

    if (normalizedStatus === "cancelado" || normalizedStatus === "rechazada") {
        return styles.cancelledStatus;
    }

    if (normalizedStatus === "finalizado" || normalizedStatus === "aprobada") {
        return styles.finishedStatus;
    }

    return styles.neutralStatus;
};

export const getTokenUserId = (accessToken?: string) => {
    if (!accessToken) {
        return null;
    }

    try {
        const payload = accessToken.split(".")[1];
        const decodedPayload = JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
            id?: string;
            sub?: string;
            user_id?: string;
        };

        return decodedPayload.id ?? decodedPayload.sub ?? decodedPayload.user_id ?? null;
    } catch {
        return null;
    }
};
