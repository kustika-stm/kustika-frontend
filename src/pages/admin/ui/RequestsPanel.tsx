import type { OrganizerRequest, OrganizerRequestStatus } from "../../../features/organizers/api";
import { formatDate, requestStatusOptions } from "../model/adminUtils";
import styles from "../admin.module.css";

type RequestsPanelProps = {
    requests: OrganizerRequest[];
    requestStatus: OrganizerRequestStatus | "todos";
    isLoading: boolean;
    pendingRequests: number;
    processingRequestId: string | null;
    onStatusChange: (status: OrganizerRequestStatus | "todos") => void;
    onRefresh: () => void;
    onApprove: (requestId: string) => void;
    onReject: (requestId: string) => void;
};

export function RequestsPanel({
    requests,
    requestStatus,
    isLoading,
    pendingRequests,
    processingRequestId,
    onStatusChange,
    onRefresh,
    onApprove,
    onReject,
}: RequestsPanelProps) {
    return (
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
                    <button type="button" onClick={onRefresh} disabled={isLoading}>
                        {isLoading ? "Cargando" : "Actualizar"}
                    </button>
                </div>

                <div className={styles.toolbar}>
                    <p>{requests.length} solicitudes</p>

                    <label className={styles.limitControl}>
                        Estado
                        <select
                            value={requestStatus}
                            onChange={(event) => onStatusChange(event.target.value as OrganizerRequestStatus | "todos")}
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
                                                    onClick={() => onApprove(request.id)}
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!isPending || isProcessing}
                                                    onClick={() => onReject(request.id)}
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

                    {!isLoading && requests.length === 0 && (
                        <div className={styles.emptyState}>
                            <strong>No hay solicitudes</strong>
                            <p>No encontramos solicitudes con el filtro seleccionado.</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className={styles.emptyState}>
                            <strong>Cargando solicitudes</strong>
                            <p>Estamos consultando las solicitudes de organizadores.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
