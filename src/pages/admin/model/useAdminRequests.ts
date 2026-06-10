import { useCallback, useState } from "react";
import { routes } from "../../../app/router/routes";
import { organizerRequestsApi, type OrganizerRequest, type OrganizerRequestStatus } from "../../../features/organizers/api";
import { useAlerts } from "../../../shared/ui/alerts";
import type { AdminPageName } from "./adminUtils";

type Params = {
    activePage: AdminPageName;
    getCurrentToken: () => string;
};

export function useAdminRequests({ activePage, getCurrentToken }: Params) {
    const alerts = useAlerts();
    const [requests, setRequests] = useState<OrganizerRequest[]>([]);
    const [requestStatus, setRequestStatus] = useState<OrganizerRequestStatus | "todos">("pendiente");
    const [isRequestsLoading, setIsRequestsLoading] = useState(activePage === "requests");
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const pendingRequests = requests.filter((request) => request.status === "pendiente").length;

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

    const handleApproveRequest = async (requestId: string) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        setProcessingRequestId(requestId);

        try {
            await organizerRequestsApi.approveRequest(currentToken, requestId);

            alerts.notify({
                tone: "success",
                title: "Solicitud aprobada",
                message: "La cuenta ya tiene permisos de organizador.",
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
            message: "Escribe el motivo que se guardará con la solicitud.",
            label: "Motivo del rechazo",
            placeholder: "Describe por qué no se aprobó la solicitud.",
            required: true,
            confirmLabel: "Rechazar",
        });

        if (!motivo?.trim()) {
            return;
        }

        setProcessingRequestId(requestId);

        try {
            await organizerRequestsApi.rejectRequest(currentToken, requestId, motivo.trim());

            alerts.notify({
                tone: "success",
                title: "Solicitud rechazada",
                message: "La solicitud fue rechazada y el motivo quedó guardado.",
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

    return {
        requests,
        requestStatus,
        isRequestsLoading,
        pendingRequests,
        processingRequestId,
        setRequestStatus,
        loadRequests,
        handleApproveRequest,
        handleRejectRequest,
    };
}
