import { routes } from "../../../app/router/routes";
import type { AuthSession, UserRole } from "./session";

const roleAliases: Record<string, UserRole> = {
    administrador: "admin",
    administrator: "admin",
    admin: "admin",
    custumer: "customer",
    customer: "customer",
    event_customer: "event_customer",
    event_manager: "event_customer",
    user: "customer",
    organizer: "event_customer",
};

export function normalizeRole(role?: string | null): UserRole {
    const normalizedRole = role?.trim().toLowerCase();

    if (!normalizedRole) {
        return "customer";
    }

    return roleAliases[normalizedRole] ?? normalizedRole;
}

export function getSessionRole(session?: AuthSession | null): UserRole {
    return normalizeRole(session?.user?.tipo_usuario);
}

export function getTokenRole(accessToken?: string) {
    if (!accessToken) {
        return null;
    }

    try {
        const base64Payload = accessToken.split(".")[1];
        const paddedPayload = base64Payload.padEnd(base64Payload.length + (4 - (base64Payload.length % 4)) % 4, "=");
        const decodedPayload = JSON.parse(window.atob(paddedPayload.replace(/-/g, "+").replace(/_/g, "/"))) as {
            role?: string;
            rol?: string;
            tipo_usuario?: string;
        };

        return normalizeRole(decodedPayload.tipo_usuario ?? decodedPayload.role ?? decodedPayload.rol);
    } catch {
        return null;
    }
}

export function getRoleHomePath(role?: string | null) {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === "admin") {
        return routes.admin;
    }

    if (normalizedRole === "event_customer") {
        return routes.eventCustomer;
    }

    return routes.home;
}
