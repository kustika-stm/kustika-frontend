import { useCallback, useEffect, useMemo, useState } from "react";
import { routes } from "../../app/router/routes";
import { clearSession, getStoredSession, saveSession, type SessionUser } from "../../entities/session";
import { adminApi, type AdminUser, type AdminUserRole } from "../../features/admin/api";
import { authApi } from "../../features/auth/api";
import { organizerRequestsApi, type OrganizerRequest, type OrganizerRequestStatus } from "../../features/organizers/api";
import { profileApi } from "../../features/profile/api";
import trashIcon from "../../shared/assets/icons/basura.png";
import userIcon from "../../shared/assets/icons/usuario.png";
import logo from "../../shared/assets/images/logo/imagotipo.png";
import styles from "./admin.module.css";

type AdminPageProps = {
    page?: "users" | "requests" | "profile";
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
    const session = getStoredSession();
    const token = session?.accessToken ?? "";
    const currentUserId = getTokenUserId(token) ?? session?.user?.id ?? null;
    const displayName = [session?.user?.nombre, session?.user?.apellido_paterno].filter(Boolean).join(" ") || "Administrador";
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [requests, setRequests] = useState<OrganizerRequest[]>([]);
    const [requestStatus, setRequestStatus] = useState<OrganizerRequestStatus | "todos">("pendiente");
    const [profile, setProfile] = useState<SessionUser | null>(session?.user ?? null);
    const [page, setPage] = useState(1);
    const [limit] = useState(usersPerPage);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRequestsLoading, setIsRequestsLoading] = useState(activePage === "requests");
    const [isProfileLoading, setIsProfileLoading] = useState(activePage === "profile");
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [requestsMessage, setRequestsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

    const loadUsers = useCallback(async (options?: { keepMessage?: boolean }) => {
        if (!token || activePage !== "users") {
            return;
        }

        setIsLoading(true);

        if (!options?.keepMessage) {
            setMessage(null);
        }

        try {
            const response = await adminApi.getUsers(token, page, limit);

            setUsers(response.usuarios);
            setTotal(response.total);
            setPages(Math.max(response.pages, 1));
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos cargar los usuarios.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [activePage, limit, page, token]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const loadRequests = useCallback(async (options?: { keepMessage?: boolean }) => {
        if (!token || activePage !== "requests") {
            return;
        }

        setIsRequestsLoading(true);

        if (!options?.keepMessage) {
            setRequestsMessage(null);
        }

        try {
            const response = await organizerRequestsApi.getRequests(token, requestStatus);

            setRequests(response);
        } catch (error) {
            setRequestsMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos cargar las solicitudes.",
            });
        } finally {
            setIsRequestsLoading(false);
        }
    }, [activePage, requestStatus, token]);

    useEffect(() => {
        void loadRequests();
    }, [loadRequests]);

    useEffect(() => {
        if (!token || activePage !== "profile") {
            return;
        }

        let isMounted = true;

        setIsProfileLoading(true);
        setProfileMessage(null);

        profileApi.getProfile(token)
            .then((userProfile) => {
                if (!isMounted) {
                    return;
                }

                const nextProfile = {
                    ...session?.user,
                    ...userProfile,
                };

                setProfile(nextProfile);
                saveSession({
                    accessToken: session?.accessToken ?? token,
                    refreshToken: session?.refreshToken ?? "",
                    user: nextProfile,
                });
            })
            .catch((error) => {
                if (isMounted) {
                    setProfileMessage({
                        type: "error",
                        text: error instanceof Error ? error.message : "No pudimos cargar tu perfil.",
                    });
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsProfileLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [activePage, token]);

    const handleRoleChange = async (user: AdminUser, rol: AdminUserRole) => {
        if (user.id === currentUserId) {
            setMessage({ type: "error", text: "No puedes cambiar tu propio rol." });
            return;
        }

        setUpdatingUserId(user.id);
        setMessage(null);

        try {
            const response = await adminApi.updateUserRole(token, user.id, rol);

            setMessage({ type: "success", text: response.message });
            await loadUsers({ keepMessage: true });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos actualizar el rol.",
            });
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleLogout = async () => {
        if (!token || isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            await authApi.logout(token);
        } finally {
            clearSession();
            window.location.assign(routes.login);
        }
    };

    const handleDeleteAccount = async () => {
        if (!token || isDeletingAccount) {
            return;
        }

        const shouldDelete = window.confirm("Esta accion eliminara tu cuenta de Evenxa. Deseas continuar?");

        if (!shouldDelete) {
            return;
        }

        setIsDeletingAccount(true);
        setProfileMessage(null);

        try {
            await profileApi.deleteAccount(token);
            clearSession();
            window.location.assign(routes.login);
        } catch (error) {
            setProfileMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos eliminar tu cuenta.",
            });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        setProcessingRequestId(requestId);
        setRequestsMessage(null);

        try {
            const response = await organizerRequestsApi.approveRequest(token, requestId);

            setRequestsMessage({ type: "success", text: response.message });
            await loadRequests({ keepMessage: true });
        } catch (error) {
            setRequestsMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos aprobar la solicitud.",
            });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const motivo = window.prompt("Motivo del rechazo");

        if (!motivo?.trim()) {
            return;
        }

        setProcessingRequestId(requestId);
        setRequestsMessage(null);

        try {
            const response = await organizerRequestsApi.rejectRequest(token, requestId, motivo.trim());

            setRequestsMessage({ type: "success", text: response.message });
            await loadRequests({ keepMessage: true });
        } catch (error) {
            setRequestsMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No pudimos rechazar la solicitud.",
            });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const profileName = [profile?.nombre, profile?.apellido_paterno, profile?.apellido_materno].filter(Boolean).join(" ") || profile?.email || displayName;
    const pendingRequests = requests.filter((request) => request.status === "pendiente").length;

    return (
        <main className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <img src={logo} alt="Evenxa" />
                    <span>Admin</span>
                </div>

                <nav className={styles.sideNav} aria-label="Panel de administracion">
                    <a className={activePage === "users" ? styles.activeNavItem : ""} href={routes.admin}>
                        <span className={styles.navIcon}>U</span>
                        Usuarios
                    </a>
                    <a className={activePage === "requests" ? styles.activeNavItem : ""} href={routes.adminRequests}>
                        <span className={styles.navIcon}>S</span>
                        Solicitudes
                    </a>
                    <a className={activePage === "profile" ? styles.activeNavItem : ""} href={routes.adminProfile}>
                        <span className={styles.navIcon}>P</span>
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
                        <h1>{activePage === "profile" ? "Mi perfil" : activePage === "requests" ? "Solicitudes" : "Usuarios"}</h1>
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

                {message && (
                    <div className={`${styles.message} ${styles[message.type]}`} role="status" aria-live="polite">
                        {message.text}
                    </div>
                )}

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

                            {requestsMessage && (
                                <div className={`${styles.message} ${styles[requestsMessage.type]}`} role="status" aria-live="polite">
                                    {requestsMessage.text}
                                </div>
                            )}

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
                        {profileMessage && (
                            <div className={`${styles.message} ${styles[profileMessage.type]}`} role="status" aria-live="polite">
                                {profileMessage.text}
                            </div>
                        )}

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
