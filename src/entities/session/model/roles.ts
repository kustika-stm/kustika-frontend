import { routes } from "../../../app/router/routes";
import type { AuthSession, UserRole } from "./session";

const roleAliases: Record<string, UserRole> = {
    user: "customer",
    organizer: "event_customer",
    administrador: "admin",
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
