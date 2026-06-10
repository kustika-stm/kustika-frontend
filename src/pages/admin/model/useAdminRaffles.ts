import { useCallback, useMemo, useState, type FormEvent } from "react";
import type { Raffle, RaffleStatus } from "../../../entities/raffle";
import { routes } from "../../../app/router/routes";
import { rafflesApi, type CreateRafflePayload } from "../../../features/raffles";
import { useAlerts } from "../../../shared/ui/alerts";
import type { AdminPageName } from "./adminUtils";

type Params = {
    activePage: AdminPageName;
    getCurrentToken: () => string;
};

export function useAdminRaffles({ activePage, getCurrentToken }: Params) {
    const alerts = useAlerts();
    const [raffleList, setRaffleList] = useState<Raffle[]>([]);
    const [isRafflesLoading, setIsRafflesLoading] = useState(activePage === "raffles");
    const [processingRaffleId, setProcessingRaffleId] = useState<string | null>(null);
    const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);

    const featuredRaffles = raffleList.filter((raffle) => raffle.featured).length;
    const totalRaffleTickets = useMemo(() => {
        return raffleList.reduce((totalTickets, raffle) => {
            const ticketCount = Number(raffle.ticketsSold.replace(/[^\d]/g, ""));

            return totalTickets + (Number.isFinite(ticketCount) ? ticketCount : 0);
        }, 0);
    }, [raffleList]);

    const loadRaffles = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "raffles") {
            return;
        }

        setIsRafflesLoading(true);

        try {
            const response = await rafflesApi.getAdminRaffles(currentToken);

            setRaffleList(response);
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Sorteos no disponibles",
                message: error instanceof Error ? error.message : "No pudimos cargar los sorteos.",
            });
        } finally {
            setIsRafflesLoading(false);
        }
    }, [activePage, alerts, getCurrentToken]);

    const handleSubmitRaffle = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") ?? "").trim();
        const subtitle = String(formData.get("subtitle") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const ticketPrice = Number(formData.get("ticketPrice"));
        const entries = String(formData.get("entries") ?? "").trim();
        const endsIn = String(formData.get("endsIn") ?? "").trim();
        const status = String(formData.get("status") ?? "trending") as RaffleStatus;
        const existingImage = String(formData.get("image") ?? "").trim();
        const imageFile = formData.get("imageFile");
        const featured = formData.get("featured") === "on";

        if (!title || !subtitle || !description || !entries || !endsIn || !Number.isFinite(ticketPrice)) {
            alerts.notify({
                tone: "error",
                title: "Sorteo incompleto",
                message: "Completa todos los datos requeridos del sorteo.",
            });
            return;
        }

        if (ticketPrice < 0) {
            alerts.notify({
                tone: "error",
                title: "Precio inválido",
                message: "El precio numérico debe ser mayor o igual a 0.",
            });
            return;
        }

        const uploadedImageFile = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;
        const shouldUseExistingImage = Boolean(editingRaffle && existingImage);

        if (!uploadedImageFile && !shouldUseExistingImage) {
            alerts.notify({
                tone: "error",
                title: "Imagen requerida",
                message: "Sube una imagen para el sorteo.",
            });
            return;
        }

        const form = event.currentTarget;
        setProcessingRaffleId(editingRaffle?.id ?? "new");

        try {
            const image = uploadedImageFile
                ? await rafflesApi.uploadAdminRaffleImage(currentToken, uploadedImageFile)
                : existingImage;
            const payload: CreateRafflePayload = {
                title,
                subtitle,
                description,
                ticketPrice,
                entries,
                endsIn,
                status,
                image,
                featured,
            };

            if (editingRaffle) {
                await rafflesApi.updateAdminRaffle(currentToken, editingRaffle.id, payload);
            } else {
                await rafflesApi.createAdminRaffle(currentToken, payload);
            }

            await loadRaffles();
            form.reset();
            setEditingRaffle(null);
            alerts.notify({
                tone: "success",
                title: editingRaffle ? "Sorteo actualizado" : "Sorteo creado",
                message: editingRaffle ? "Los cambios se guardaron correctamente." : "El sorteo ya está disponible en el catálogo.",
            });
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: editingRaffle ? "No pudimos actualizar el sorteo" : "No pudimos crear el sorteo",
                message: error instanceof Error ? error.message : "Inténtalo nuevamente en unos momentos.",
            });
        } finally {
            setProcessingRaffleId(null);
        }
    };

    const handleDeleteRaffle = async (raffle: Raffle) => {
        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        const shouldDelete = await alerts.confirm({
            tone: "error",
            title: "Eliminar sorteo",
            message: `Esta acción eliminará "${raffle.title}" del catálogo.`,
            confirmLabel: "Eliminar",
        });

        if (!shouldDelete) {
            return;
        }

        setProcessingRaffleId(raffle.id);

        try {
            await rafflesApi.deleteAdminRaffle(currentToken, raffle.id);

            if (editingRaffle?.id === raffle.id) {
                setEditingRaffle(null);
            }

            await loadRaffles();
            alerts.notify({
                tone: "success",
                title: "Sorteo eliminado",
                message: "El sorteo se eliminó del catálogo correctamente.",
            });
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos eliminar el sorteo",
                message: error instanceof Error ? error.message : "Inténtalo nuevamente en unos momentos.",
            });
        } finally {
            setProcessingRaffleId(null);
        }
    };

    return {
        raffleList,
        featuredRaffles,
        totalRaffleTickets,
        editingRaffle,
        isRafflesLoading,
        processingRaffleId,
        setEditingRaffle,
        loadRaffles,
        handleSubmitRaffle,
        handleDeleteRaffle,
    };
}
