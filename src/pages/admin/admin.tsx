import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { routes } from "../../app/router/routes";
import type { Raffle, RaffleStatus } from "../../entities/raffle";
import { clearSession, getStoredSession, saveSession, type SessionUser } from "../../entities/session";
import { adminApi, type AdminEvent, type AdminUser, type AdminUserRole } from "../../features/admin/api";
import { authApi } from "../../features/auth/api";
import { eventsApi, type AddTicketTypePayload, type CreateEventPayload, type EventCategory } from "../../features/events/api";
import { organizerRequestsApi, type OrganizerRequest, type OrganizerRequestStatus } from "../../features/organizers/api";
import { profileApi } from "../../features/profile/api";
import { rafflesApi, type CreateRafflePayload } from "../../features/raffles";
import { useAlerts } from "../../shared/ui/alerts";
import { AdminLayout } from "./ui/AdminLayout";
import { AdminProfilePanel } from "./ui/AdminProfilePanel";
import { EventsPanel, type AdminEventTicketForm } from "./ui/EventsPanel";
import { RafflesPanel } from "./ui/RafflesPanel";
import { RequestsPanel } from "./ui/RequestsPanel";
import { UsersPanel } from "./ui/UsersPanel";
import { getTokenUserId, usersPerPage, type AdminPageName } from "./model/adminUtils";

type AdminPageProps = {
    page?: AdminPageName;
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
    const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
    const [eventCategoriesStatus, setEventCategoriesStatus] = useState("");
    const [raffleList, setRaffleList] = useState<Raffle[]>([]);
    const [requests, setRequests] = useState<OrganizerRequest[]>([]);
    const [requestStatus, setRequestStatus] = useState<OrganizerRequestStatus | "todos">("pendiente");
    const [profile, setProfile] = useState<SessionUser | null>(session?.user ?? null);
    const [page, setPage] = useState(1);
    const [limit] = useState(usersPerPage);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isEventsLoading, setIsEventsLoading] = useState(activePage === "events");
    const [isRafflesLoading, setIsRafflesLoading] = useState(activePage === "raffles");
    const [isRequestsLoading, setIsRequestsLoading] = useState(activePage === "requests");
    const [isProfileLoading, setIsProfileLoading] = useState(activePage === "profile");
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [processingRaffleId, setProcessingRaffleId] = useState<string | null>(null);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [eventFormResetKey, setEventFormResetKey] = useState(0);
    const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
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

    const splitValues = (value: string) => {
        return value
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const optionalText = (value: string) => {
        const trimmedValue = value.trim();

        return trimmedValue || undefined;
    };

    const optionalNumber = (value: string) => {
        return value === "" ? undefined : Number(value);
    };

    const buildAdminEventPayload = (formData: FormData, imageUrl?: string): CreateEventPayload => {
        const artistas = splitValues(String(formData.get("artistas") ?? "")).map((nombre) => ({ nombre }));
        const tags = splitValues(String(formData.get("tags") ?? ""));

        return {
            titulo: String(formData.get("titulo") ?? "").trim(),
            categoria_id: String(formData.get("categoria_id") ?? "").trim(),
            nombre_venue: String(formData.get("nombre_venue") ?? "").trim(),
            descripcion: optionalText(String(formData.get("descripcion") ?? "")),
            descripcion_corta: optionalText(String(formData.get("descripcion_corta") ?? "")),
            direccion_venue: optionalText(String(formData.get("direccion_venue") ?? "")),
            ciudad_venue: optionalText(String(formData.get("ciudad_venue") ?? "")),
            imagen_portada: imageUrl,
            artistas: artistas.length ? artistas : undefined,
            tags: tags.length ? tags : undefined,
            edad_minima: optionalNumber(String(formData.get("edad_minima") ?? "")) ?? 0,
        };
    };

    const buildAdminTicketPayload = (ticket: AdminEventTicketForm): AddTicketTypePayload => ({
        nombre: ticket.nombre.trim(),
        precio: Number(ticket.precio),
        cantidad_total: Number(ticket.cantidad_total),
        cargo_servicio: optionalNumber(ticket.cargo_servicio),
        max_por_orden: optionalNumber(ticket.max_por_orden),
        zona: optionalText(ticket.zona),
        color: optionalText(ticket.color),
    });

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

    const loadEvents = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "events") {
            return;
        }

        setIsEventsLoading(true);

        try {
            const [eventItems, categoryItems] = await Promise.allSettled([
                adminApi.getEvents(currentToken),
                eventsApi.getCategories(),
            ]);

            if (eventItems.status === "fulfilled") {
                setEvents(eventItems.value);
            } else {
                throw eventItems.reason;
            }

            if (categoryItems.status === "fulfilled") {
                setEventCategories(categoryItems.value);
                setEventCategoriesStatus("");
            } else {
                setEventCategories([]);
                setEventCategoriesStatus(categoryItems.reason instanceof Error ? categoryItems.reason.message : "Categorías no disponibles.");
            }
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
            void loadUsers();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadUsers]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadEvents();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadEvents]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadRaffles();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadRaffles]);

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

            if (activePage === "raffles") {
                void loadRaffles();
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
    }, [activePage, loadEvents, loadRaffles, loadRequests, loadUsers]);

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
            message: "Esta acción eliminará tu cuenta de Kustika y cerrará tu sesión actual.",
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

    const handleCreateEvent = async (event: FormEvent<HTMLFormElement>, tickets: AdminEventTicketForm[]) => {
        event.preventDefault();

        const currentToken = getCurrentToken();

        if (!currentToken) {
            window.location.assign(routes.login);
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);
        const title = String(formData.get("titulo") ?? "").trim();
        const categoryId = String(formData.get("categoria_id") ?? "").trim();
        const venueName = String(formData.get("nombre_venue") ?? "").trim();
        const startsAt = String(formData.get("fecha_inicio") ?? "").trim();
        const validTickets = tickets.filter((ticket) => (
            ticket.nombre.trim() && ticket.precio !== "" && ticket.cantidad_total !== ""
        ));
        const imageFile = formData.get("imagen_portada_file");
        const uploadedImageFile = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

        if (!title || !categoryId || !venueName) {
            alerts.notify({ tone: "error", title: "Datos incompletos", message: "Completa título, categoría y lugar del evento." });
            return;
        }

        if (!startsAt) {
            alerts.notify({ tone: "error", title: "Función incompleta", message: "Agrega la fecha y hora de inicio de la función." });
            return;
        }

        if (!validTickets.length) {
            alerts.notify({
                tone: "error",
                title: "Boletos incompletos",
                message: "Agrega al menos un tipo de boleto con nombre, precio y cantidad.",
            });
            return;
        }

        setIsCreatingEvent(true);

        try {
            const uploadedImageUrl = uploadedImageFile
                ? await eventsApi.uploadImage(currentToken, uploadedImageFile)
                : undefined;
            const createdEvent = await eventsApi.createEvent(currentToken, buildAdminEventPayload(formData, uploadedImageUrl));
            const createdFunction = await eventsApi.addFunction(currentToken, createdEvent.id, {
                fecha_inicio: startsAt,
                nombre: optionalText(String(formData.get("funcion_nombre") ?? "")),
                fecha_fin: optionalText(String(formData.get("fecha_fin") ?? "")),
                fecha_apertura_puertas: optionalText(String(formData.get("fecha_apertura_puertas") ?? "")),
            });

            await Promise.all(validTickets.map((ticket) => (
                eventsApi.addTicketType(currentToken, createdFunction.id, buildAdminTicketPayload(ticket))
            )));

            if (formData.get("publish_now") === "on") {
                await eventsApi.publishEvent(currentToken, createdEvent.id);
            }

            await loadEvents();
            form.reset();
            setEventFormResetKey((current) => current + 1);
            alerts.notify({
                tone: "success",
                title: "Evento creado",
                message: formData.get("publish_now") === "on"
                    ? "Evento creado y publicado correctamente."
                    : "Evento guardado como borrador correctamente.",
            });
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "No pudimos crear el evento",
                message: error instanceof Error ? error.message : "Inténtalo nuevamente en unos momentos.",
            });
        } finally {
            setIsCreatingEvent(false);
        }
    };

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
                message: "El precio numerico debe ser mayor o igual a 0.",
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
            const response = await rafflesApi.deleteAdminRaffle(currentToken, raffle.id);

            if (editingRaffle?.id === raffle.id) {
                setEditingRaffle(null);
            }

            await loadRaffles();
            alerts.notify({
                tone: "success",
                title: "Sorteo eliminado",
                message: response.message,
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

    const profileName = [profile?.nombre, profile?.apellido_paterno, profile?.apellido_materno].filter(Boolean).join(" ") || profile?.email || displayName;
    const pendingRequests = requests.filter((request) => request.status === "pendiente").length;
    const publishedEvents = events.filter((event) => event.status.toLowerCase() === "publicado").length;
    const cancelledEvents = events.filter((event) => event.status.toLowerCase() === "cancelado").length;
    const featuredRaffles = raffleList.filter((raffle) => raffle.featured).length;
    const totalRaffleTickets = raffleList.reduce((totalTickets, raffle) => {
        const ticketCount = Number(raffle.ticketsSold.replace(/[^\d]/g, ""));

        return totalTickets + (Number.isFinite(ticketCount) ? ticketCount : 0);
    }, 0);

    return (
        <AdminLayout
            activePage={activePage}
            displayName={displayName}
            isLoggingOut={isLoggingOut}
            onLogout={handleLogout}
        >
            {activePage === "users" && (
                <UsersPanel
                    users={users}
                    total={total}
                    page={page}
                    pages={pages}
                    pageLabel={pageLabel}
                    isLoading={isLoading}
                    currentUserId={currentUserId}
                    updatingUserId={updatingUserId}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                    setPage={setPage}
                    onRefresh={() => void loadUsers()}
                    onRoleChange={(user, role) => void handleRoleChange(user, role)}
                />
            )}

            {activePage === "events" && (
                <EventsPanel
                    key={eventFormResetKey}
                    events={events}
                    categories={eventCategories}
                    categoriesStatus={eventCategoriesStatus}
                    isLoading={isEventsLoading}
                    isCreatingEvent={isCreatingEvent}
                    publishedEvents={publishedEvents}
                    cancelledEvents={cancelledEvents}
                    onRefresh={() => void loadEvents()}
                    onCreateEvent={(event, tickets) => void handleCreateEvent(event, tickets)}
                />
            )}

            {activePage === "raffles" && (
                <RafflesPanel
                    raffles={raffleList}
                    featuredRaffles={featuredRaffles}
                    totalRaffleTickets={totalRaffleTickets}
                    editingRaffle={editingRaffle}
                    isLoading={isRafflesLoading}
                    processingRaffleId={processingRaffleId}
                    onSubmitRaffle={(event) => void handleSubmitRaffle(event)}
                    onEditRaffle={setEditingRaffle}
                    onCancelEdit={() => setEditingRaffle(null)}
                    onDeleteRaffle={(raffle) => void handleDeleteRaffle(raffle)}
                    onRefresh={() => void loadRaffles()}
                />
            )}

            {activePage === "requests" && (
                <RequestsPanel
                    requests={requests}
                    requestStatus={requestStatus}
                    isLoading={isRequestsLoading}
                    pendingRequests={pendingRequests}
                    processingRequestId={processingRequestId}
                    onStatusChange={setRequestStatus}
                    onRefresh={() => void loadRequests()}
                    onApprove={(requestId) => void handleApproveRequest(requestId)}
                    onReject={(requestId) => void handleRejectRequest(requestId)}
                />
            )}

            {activePage === "profile" && (
                <AdminProfilePanel
                    profile={profile}
                    profileName={profileName}
                    isLoading={isProfileLoading}
                    isDeletingAccount={isDeletingAccount}
                    onDeleteAccount={() => void handleDeleteAccount()}
                />
            )}
        </AdminLayout>
    );
}
