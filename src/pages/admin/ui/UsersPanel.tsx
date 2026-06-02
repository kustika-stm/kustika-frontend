import type { Dispatch, SetStateAction } from "react";
import type { AdminUser, AdminUserRole } from "../../../features/admin/api";
import { getFullName, roleOptions, usersPerPage, formatDate } from "../model/adminUtils";
import styles from "../admin.module.css";

type UsersPanelProps = {
    users: AdminUser[];
    total: number;
    page: number;
    pages: number;
    pageLabel: string;
    isLoading: boolean;
    currentUserId: string | null;
    updatingUserId: string | null;
    canGoPrevious: boolean;
    canGoNext: boolean;
    setPage: Dispatch<SetStateAction<number>>;
    onRefresh: () => void;
    onRoleChange: (user: AdminUser, role: AdminUserRole) => void;
};

export function UsersPanel({
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
    onRefresh,
    onRoleChange,
}: UsersPanelProps) {
    return (
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
                    <button type="button" onClick={onRefresh} disabled={isLoading}>
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
                                        <td>{user.telefono || "Sin teléfono"}</td>
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
                                                onChange={(event) => onRoleChange(user, event.target.value as AdminUserRole)}
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
                            <p>Aún no hay cuentas para mostrar en esta página.</p>
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
    );
}
