import { useCallback, useEffect, useMemo, useState } from "react";
import { routes } from "../../app/router/routes";
import { clearSession, getStoredSession, saveSession, type SessionUser } from "../../entities/session";
import { adminApi, type AdminEvent, type AdminUser, type AdminUserRole } from "../../features/admin/api";
import { authApi } from "../../features/auth/api";
import { organizerRequestsApi, type OrganizerRequest, type OrganizerRequestStatus } from "../../features/organizers/api";
import { profileApi } from "../../features/profile/api";
import { useAlerts } from "../../shared/ui/alerts";
import trashIcon from "../../shared/assets/icons/basura.png";
import userIcon from "../../shared/assets/icons/usuario.png";
import { kustikaMark } from "../../shared/assets/images/logo";
import styles from "./admin.module.css";

type AdminPageProps = {
    page?: "users" | "events" | "requests" | "profile";
};

const roleOptions: Array<{ value: AdminUserRole; label: string }> = [
    { value: "customer", label: "Customer" },
    { value: "event_manager", label: "Event manager" },
    { value: "admin", label: "Admin" },
];

const usersPerPage = 10;
const requestStatusOptions: Array<{ value: OrganizerRequestStatus | "todos"; label: string }> = [
    { value: "todos", label: "Todas" },
    { value: "pendiente", label: "Pendientes" },
    { value: "aprobada", label: "Aprobadas" },
    { value: "rechazada", label: "Rechazadas" },
];

const getFullName = (user: AdminUser) =>
    [user.nombre, user.apellido_paterno, user.apellido_materno].filter(Boolean).join(" ") || "Sin nombre";

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));

const formatOptionalDate = (value?: string) => {
    if (!value) {
        return "Sin fecha";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : formatDate(value);
};

const getStatusClassName = (status: string) => {
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

const getTokenUserId = (accessToken?: string) => {
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

export function AdminPage({ page: activePage = "users" }: AdminPageProps) {
    const alerts = useAlerts();
    const session = getStoredSession();
    const token = session?.accessToken ?? "";
    const getCurrentToken = useCallback(() => getStoredSession()?.accessToken ?? token, [token]);
    const currentUserId = getTokenUserId(token) ?? session?.user?.id ?? null;
    const displayName = [session?.user?.nombre, session?.user?.apellido_paterno].filter(Boolean).join(" ") || "Administrador";
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [requests, setRequests] = useState<OrganizerRequest[]>([]);
    const [requestStatus, setRequestStatus] = useState<OrganizerRequestStatus | "todos">("pendiente");
    const [profile, setProfile] = useState<SessionUser | null>(session?.user ?? null);
    const [page, setPage] = useState(1);
    const [limit] = useState(usersPerPage);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isEventsLoading, setIsEventsLoading] = useState(activePage === "events");
    const [isRequestsLoading, setIsRequestsLoading] = useState(activePage === "requests");
    const [isProfileLoading, setIsProfileLoading] = useState(activePage === "profile");
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
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

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadUsers();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadUsers]);

    const loadEvents = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "events") {
            return;
        }

        setIsEventsLoading(true);

        try {
            const response = await adminApi.getEvents(currentToken);

            setEvents(response);
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Eventos no disponibles",
                message: error instanceof Error ? error.message : "No pudimos cargar los eventos.",
            });
        } finally {
            setIsEventsLoading(false);
        }
    }, [activePage, alerts, getCurrentToken]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadEvents();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadEvents]);

    const loadRequests = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "requests") {
            return;
        }

        setIsRequestsLoading(true);

        try {
            const response = await organizerRequestsApi.getRequests(currentToken, requestStatus);

            setRequests(response);
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Solicitudes no disponibles",
                message: error instanceof Error ? error.message : "No pudimos cargar las solicitudes.",
            });
        } finally {
            setIsRequestsLoading(false);
        }
    }, [activePage, alerts, getCurrentToken, requestStatus]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadRequests();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadRequests]);

    useEffect(() => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "profile") {
            return;
        }

        let isMounted = true;

        const timer = window.setTimeout(() => {
            setIsProfileLoading(true);

            profileApi.getProfile(currentToken)
                .then((userProfile) => {
                    if (!isMounted) {
                        return;
                    }

                    const currentSession = getStoredSession();
                    const nextProfile = {
                        ...currentSession?.user,
                        ...userProfile,
                    };

                    setProfile(nextProfile);
                    saveSession({
                        accessToken: currentToken,
                        refreshToken: currentSession?.refreshToken ?? "",
                        user: nextProfile,
                    });
                })
                .catch((error) => {
                    if (isMounted) {
                        alerts.notify({
                            tone: "error",
                            title: "Perfil no disponible",
                            message: error instanceof Error ? error.message : "No pudimos cargar tu perfil.",
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) {
                        setIsProfileLoading(false);
                    }
                });
        }, 0);

        return () => {
            isMounted = false;
            window.clearTimeout(timer);
        };
    }, [activePage, alerts, getCurrentToken]);

    useEffect(() => {
        const reloadActivePage = () => {
            if (document.visibilityState === "hidden") {
                return;
            }

            if (activePage === "users") {
                void loadUsers();
                return;
            }

            if (activePage === "events") {
                void loadEvents();
                return;
            }

            if (activePage === "requests") {
                void loadRequests();
            }
        };

        window.addEventListener("focus", reloadActivePage);
        window.addEventListener("online", reloadActivePage);
        document.addEventListener("visibilitychange", reloadActivePage);

        return () => {
            window.removeEventListener("focus", reloadActivePage);
            window.removeEventListener("online", reloadActivePage);
            document.removeEventListener("visibilitychange", reloadActivePage);
        };
    }, [activePage, loadEvents, loadRequests, loadUsers]);

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
            const response = await adminApi.updateUserRole(currentToken, user.id, rol);

            alerts.notify({
                tone: "success",
                title: "Rol actualizado",
                message: response.message,
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

    const handleLogout = async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            await authApi.logout(currentToken);
        } finally {
            clearSession();
            window.location.assign(routes.login);
        }
    };

    const handleDeleteAccount = async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || isDeletingAccount) {
            return;
        }

        const shouldDelete = await alerts.confirm({
            tone: "error",
            title: "Eliminar cuenta",
            message: "Esta accion eliminara tu cuenta de Kustika y cerrara tu sesion actual.",
            confirmLabel: "Eliminar cuenta",
        });

        if (!shouldDelete) {
            return;
        }

        setIsDeletingAccount(true);

        try {
            await profileApi.deleteAccount(currentToken);
            clearSession();
            window.location.assign(routes.login);
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos eliminar tu cuenta",
                message: error instanceof Error ? error.message : "No pudimos eliminar tu cuenta.",
            });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        setProcessingRequestId(requestId);

        try {
            const response = await organizerRequestsApi.approveRequest(currentToken, requestId);

            alerts.notify({
                tone: "success",
                title: "Solicitud aprobada",
                message: response.message,
            });
            await loadRequests();
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos aprobar la solicitud",
                message: error instanceof Error ? error.message : "No pudimos aprobar la solicitud.",
            });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        const motivo = await alerts.prompt({
            tone: "warning",
            title: "Rechazar solicitud",
            message: "Escribe el motivo que se guardara con la solicitud.",
            label: "Motivo del rechazo",
            placeholder: "Describe por que no se aprobo la solicitud.",
            required: true,
            confirmLabel: "Rechazar",
        });

        if (!motivo?.trim()) {
            return;
        }

        setProcessingRequestId(requestId);

        try {
            const response = await organizerRequestsApi.rejectRequest(currentToken, requestId, motivo.trim());

            alerts.notify({
                tone: "success",
                title: "Solicitud rechazada",
                message: response.message,
            });
            await loadRequests();
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos rechazar la solicitud",
                message: error instanceof Error ? error.message : "No pudimos rechazar la solicitud.",
            });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const profileName = [profile?.nombre, profile?.apellido_paterno, profile?.apellido_materno].filter(Boolean).join(" ") || profile?.email || displayName;
    const pendingRequests = requests.filter((request) => request.status === "pendiente").length;
    const publishedEvents = events.filter((event) => event.status.toLowerCase() === "publicado").length;
    const cancelledEvents = events.filter((event) => event.status.toLowerCase() === "cancelado").length;

    return (
        <main className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <img src={kustikaMark} alt="Kustika" />
                    <span>Admin</span>
                </div>

                <nav className={styles.sideNav} aria-label="Panel de administracion">
                    <a className={activePage === "users" ? styles.activeNavItem : ""} href={routes.admin}>
                        Usuarios
                    </a>
                    <a className={activePage === "events" ? styles.activeNavItem : ""} href={routes.adminEvents}>
                        Eventos
                    </a>
                    <a className={activePage === "requests" ? styles.activeNavItem : ""} href={routes.adminRequests}>
                        Solicitudes
                    </a>
                    <a className={activePage === "profile" ? styles.activeNavItem : ""} href={routes.adminProfile}>
                        Mi perfil
                    </a>
                </nav>

                <button className={styles.sidebarLogout} type="button" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                </button>
            </aside>

            <section className={styles.workspace}>
                <header className={styles.topbar}>
                    <div>
                        <span>Panel de Control</span>
                        <h1>{
                            activePage === "profile"
                                ? "Mi perfil"
                                : activePage === "requests"
                                    ? "Solicitudes"
                                    : activePage === "events" ? "Eventos" : "Usuarios"
                        }</h1>
                    </div>

                    <div className={styles.account}>
                        <img src={userIcon} alt="" aria-hidden="true" />
                        <strong>{displayName}</strong>
                    </div>
                </header>

                {activePage === "users" ? (
                    <>
                        <section className={styles.statsGrid} aria-label="Resumen de usuarios">
                    <article>
                        <span>Total usuarios</span>
                        <strong>{total}</strong>
                    </article>
                    <article>
                        <span>Pagina actual</span>
                        <strong>{page}</strong>
                    </article>
                    <article>
                        <span>Por pagina</span>
                        <strong>{usersPerPage}</strong>
                    </article>
                </section>

                <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                    <div>
                        <span>Administracion de accesos</span>
                        <h2>Cuentas registradas</h2>
                    </div>
                    <button type="button" onClick={() => void loadUsers()} disabled={isLoading}>
                        {isLoading ? "Cargando" : "Actualizar"}
                    </button>
                </div>

                <div className={styles.toolbar}>
                    <p>{pageLabel}</p>

                    <span className={styles.limitControl}>10 por pagina</span>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.usersTable}>
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Telefono</th>
                                <th>Estado</th>
                                <th>Creado</th>
                                <th>Rol</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const isCurrentUser = user.id === currentUserId;
                                const isUpdating = updatingUserId === user.id;

                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <strong>{getFullName(user)}</strong>
                                            <span>{user.email}</span>
                                            {isCurrentUser && <small>Tu cuenta</small>}
                                        </td>
                                        <td>{user.telefono || "Sin telefono"}</td>
                                        <td>
                                            <div className={styles.statusList}>
                                                <span className={user.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                                    {user.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                                <span className={user.email_verified ? styles.activeBadge : styles.inactiveBadge}>
                                                    {user.email_verified ? "Verificado" : "Sin verificar"}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{formatDate(user.created_at)}</td>
                                        <td>
                                            <select
                                                value={user.rol}
                                                disabled={isCurrentUser || isUpdating || isLoading}
                                                onChange={(event) => {
                                                    void handleRoleChange(user, event.target.value as AdminUserRole);
                                                }}
                                                aria-label={`Cambiar rol de ${getFullName(user)}`}
                                            >
                                                {roleOptions.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {!isLoading && users.length === 0 && (
                        <div className={styles.emptyState}>
                            <strong>No hay usuarios cargados</strong>
                            <p>Aun no hay cuentas para mostrar en esta pagina.</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className={styles.emptyState}>
                            <strong>Cargando usuarios</strong>
                            <p>Estamos consultando el panel de administracion.</p>
                        </div>
                    )}
                </div>

                <div className={styles.pagination}>
                    <button type="button" disabled={!canGoPrevious} onClick={() => setPage((currentPage) => currentPage - 1)}>
                        Anterior
                    </button>
                    <span>Pagina {page} de {pages}</span>
                    <button type="button" disabled={!canGoNext} onClick={() => setPage((currentPage) => currentPage + 1)}>
                        Siguiente
                    </button>
                </div>
                </section>
                    </>
                ) : activePage === "events" ? (
                    <>
                        <section className={styles.statsGrid} aria-label="Resumen de eventos">
                            <article>
                                <span>Total eventos</span>
                                <strong>{events.length}</strong>
                            </article>
                            <article>
                                <span>Publicados</span>
                                <strong>{publishedEvents}</strong>
                            </article>
                            <article>
                                <span>Cancelados</span>
                                <strong>{cancelledEvents}</strong>
                            </article>
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <span>Catalogo de eventos</span>
                                    <h2>Eventos existentes</h2>
                                </div>
                                <button type="button" onClick={() => void loadEvents()} disabled={isEventsLoading}>
                                    {isEventsLoading ? "Cargando" : "Actualizar"}
                                </button>
                            </div>

                            <div className={styles.toolbar}>
                                <p>{events.length} eventos</p>
                            </div>

                            <div className={styles.eventsList}>
                                {events.map((event) => (
                                    <article className={styles.eventRow} key={event.id}>
                                        <div className={styles.eventMain}>
                                            <strong>{event.titulo}</strong>
                                            <p>{[event.categoria, event.venue_nombre, event.ciudad_venue].filter(Boolean).join(" - ") || "Sin categoria o venue"}</p>
                                        </div>
                                        <span className={getStatusClassName(event.status)}>{event.status}</span>
                                        <div className={styles.eventDates}>
                                            <span>Creado</span>
                                            <strong>{formatOptionalDate(event.created_at)}</strong>
                                        </div>
                                        <div className={styles.eventDates}>
                                            <span>Inicio</span>
                                            <strong>{formatOptionalDate(event.fecha_inicio)}</strong>
                                        </div>
                                    </article>
                                ))}

                                {!isEventsLoading && events.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <strong>No hay eventos cargados</strong>
                                        <p>Aun no encontramos eventos para mostrar en el panel.</p>
                                    </div>
                                )}

                                {isEventsLoading && (
                                    <div className={styles.emptyState}>
                                        <strong>Cargando eventos</strong>
                                        <p>Estamos consultando el catalogo de eventos existentes.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                ) : activePage === "requests" ? (
                    <>
                        <section className={styles.statsGrid} aria-label="Resumen de solicitudes">
                            <article>
                                <span>Solicitudes visibles</span>
                                <strong>{requests.length}</strong>
                            </article>
                            <article>
                                <span>Pendientes</span>
                                <strong>{pendingRequests}</strong>
                            </article>
                            <article>
                                <span>Filtro</span>
                                <strong>{requestStatus === "todos" ? "Todas" : requestStatus}</strong>
                            </article>
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <span>Solicitudes de organizadores</span>
                                    <h2>Accesos para publicar eventos</h2>
                                </div>
                                <button type="button" onClick={() => void loadRequests()} disabled={isRequestsLoading}>
                                    {isRequestsLoading ? "Cargando" : "Actualizar"}
                                </button>
                            </div>

                            <div className={styles.toolbar}>
                                <p>{requests.length} solicitudes</p>

                                <label className={styles.limitControl}>
                                    Estado
                                    <select
                                        value={requestStatus}
                                        onChange={(event) => setRequestStatus(event.target.value as OrganizerRequestStatus | "todos")}
                                    >
                                        {requestStatusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className={styles.tableWrap}>
                                <table className={styles.usersTable}>
                                    <thead>
                                        <tr>
                                            <th>Empresa</th>
                                            <th>Solicitante</th>
                                            <th>RFC</th>
                                            <th>Estado</th>
                                            <th>Fecha</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((request) => {
                                            const isProcessing = processingRequestId === request.id;
                                            const isPending = request.status === "pendiente";

                                            return (
                                                <tr key={request.id}>
                                                    <td>
                                                        <strong>{request.nombre_empresa}</strong>
                                                    </td>
                                                    <td>
                                                        <strong>{[request.nombre, request.apellido_paterno].filter(Boolean).join(" ") || request.email}</strong>
                                                        <span>{request.email}</span>
                                                    </td>
                                                    <td>{request.rfc}</td>
                                                    <td>
                                                        <span className={styles[request.status]}>{request.status}</span>
                                                    </td>
                                                    <td>{formatDate(request.created_at)}</td>
                                                    <td>
                                                        <div className={styles.rowActions}>
                                                            <button
                                                                type="button"
                                                                disabled={!isPending || isProcessing}
                                                                onClick={() => void handleApproveRequest(request.id)}
                                                            >
                                                                Aprobar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!isPending || isProcessing}
                                                                onClick={() => void handleRejectRequest(request.id)}
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {!isRequestsLoading && requests.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <strong>No hay solicitudes</strong>
                                        <p>No encontramos solicitudes con el filtro seleccionado.</p>
                                    </div>
                                )}

                                {isRequestsLoading && (
                                    <div className={styles.emptyState}>
                                        <strong>Cargando solicitudes</strong>
                                        <p>Estamos consultando las solicitudes de organizadores.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                ) : (
                    <section className={styles.profilePanel}>
                        <article className={styles.profileHero}>
                            <div className={styles.profileAvatar} aria-hidden="true">
                                {profileName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <span>Administrador</span>
                                <h2>{isProfileLoading ? "Cargando perfil" : profileName}</h2>
                                <p>Consulta los datos de tu cuenta administradora sin salir del panel.</p>
                            </div>
                        </article>

                        <article className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <span>Cuenta</span>
                                    <h2>Datos personales</h2>
                                </div>
                            </div>

                            <dl className={styles.profileGrid}>
                                <div>
                                    <dt>Nombre</dt>
                                    <dd>{profile?.nombre || "Sin nombre"}</dd>
                                </div>
                                <div>
                                    <dt>Apellido paterno</dt>
                                    <dd>{profile?.apellido_paterno || "Sin apellido"}</dd>
                                </div>
                                <div>
                                    <dt>Apellido materno</dt>
                                    <dd>{profile?.apellido_materno || "Sin apellido"}</dd>
                                </div>
                                <div>
                                    <dt>Correo</dt>
                                    <dd>{profile?.email || "Sin correo"}</dd>
                                </div>
                                <div>
                                    <dt>Telefono</dt>
                                    <dd>{profile?.telefono || "Sin telefono"}</dd>
                                </div>
                            </dl>
                        </article>

                        <section className={styles.dangerZone}>
                            <div>
                                <span>Zona sensible</span>
                                <h2>Eliminar cuenta</h2>
                                <p>Esta accion elimina tu cuenta y cierra la sesion actual.</p>
                            </div>
                            <button type="button" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                                <img src={trashIcon} alt="" aria-hidden="true" />
                                {isDeletingAccount ? "Eliminando..." : "Eliminar cuenta"}
                            </button>
                        </section>
                    </section>
                )}
            </section>
        </main>
    );
}
