import { useCallback, useMemo, useState } from "react";
import { routes } from "../../../app/router/routes";
import { adminApi, type AdminUser, type AdminUserRole } from "../../../features/admin/api";
import { useAlerts } from "../../../shared/ui/alerts";
import { usersPerPage, type AdminPageName } from "./adminUtils";

type Params = {
    activePage: AdminPageName;
    currentUserId: string | null;
    getCurrentToken: () => string;
};

export function useAdminUsers({ activePage, currentUserId, getCurrentToken }: Params) {
    const alerts = useAlerts();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(usersPerPage);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(activePage === "users");
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const canGoPrevious = page > 1 && !isLoading;
    const canGoNext = page < pages && !isLoading;

    const pageLabel = useMemo(() => {
        if (!total) {
            return "0 usuarios";
        }

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        return `${start}-${end} de ${total} usuarios`;
    }, [limit, page, total]);

    const loadUsers = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "users") {
            return;
        }

        setIsLoading(true);

        try {
            const response = await adminApi.getUsers(currentToken, page, limit);

            setUsers(response.usuarios);
            setTotal(response.total);
            setPages(Math.max(response.pages, 1));
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Usuarios no disponibles",
                message: error instanceof Error ? error.message : "No pudimos cargar los usuarios.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [activePage, alerts, getCurrentToken, limit, page]);

    const handleRoleChange = async (user: AdminUser, rol: AdminUserRole) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        if (user.id === currentUserId) {
            alerts.notify({
                tone: "warning",
                title: "Cambio no permitido",
                message: "No puedes cambiar tu propio rol.",
            });
            return;
        }

        setUpdatingUserId(user.id);

        try {
            await adminApi.updateUserRole(currentToken, user.id, rol);

            alerts.notify({
                tone: "success",
                title: "Rol actualizado",
                message: "El nuevo rol del usuario se guardó correctamente.",
            });
            await loadUsers();
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos actualizar el rol",
                message: error instanceof Error ? error.message : "No pudimos actualizar el rol.",
            });
        } finally {
            setUpdatingUserId(null);
        }
    };

    return {
        users,
        total,
        page,
        pages,
        pageLabel,
        isLoading,
        currentUserId,
        updatingUserId,
        canGoPrevious,
        canGoNext,
        setPage,
        loadUsers,
        handleRoleChange,
    };
}
