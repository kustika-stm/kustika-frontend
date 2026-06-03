import { useCallback, useEffect, useState } from "react";
import { routes } from "../../app/router/routes";
import { clearSession, getStoredSession } from "../../entities/session";
import { authApi } from "../../features/auth/api";
import { AdminLayout } from "./ui/AdminLayout";
import { AdminProfilePanel } from "./ui/AdminProfilePanel";
import { EventsPanel } from "./ui/EventsPanel";
import { RafflesPanel } from "./ui/RafflesPanel";
import { RequestsPanel } from "./ui/RequestsPanel";
import { UsersPanel } from "./ui/UsersPanel";
import { getTokenUserId, type AdminPageName } from "./model/adminUtils";
import { useAdminEvents } from "./model/useAdminEvents";
import { useAdminProfile } from "./model/useAdminProfile";
import { useAdminRaffles } from "./model/useAdminRaffles";
import { useAdminRequests } from "./model/useAdminRequests";
import { useAdminUsers } from "./model/useAdminUsers";

type AdminPageProps = {
    page?: AdminPageName;
};

export function AdminPage({ page: activePage = "users" }: AdminPageProps) {
    const session = getStoredSession();
    const token = session?.accessToken ?? "";
    const getCurrentToken = useCallback(() => getStoredSession()?.accessToken ?? token, [token]);
    const currentUserId = getTokenUserId(token) ?? session?.user?.id ?? null;
    const displayName = [session?.user?.nombre, session?.user?.apellido_paterno].filter(Boolean).join(" ") || "Administrador";
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const usersPanel = useAdminUsers({ activePage, currentUserId, getCurrentToken });
    const eventsPanel = useAdminEvents({ activePage, getCurrentToken });
    const rafflesPanel = useAdminRaffles({ activePage, getCurrentToken });
    const requestsPanel = useAdminRequests({ activePage, getCurrentToken });
    const profilePanel = useAdminProfile({
        activePage,
        displayName,
        getCurrentToken,
        initialProfile: session?.user ?? null,
    });
    const { loadUsers } = usersPanel;
    const { loadEvents } = eventsPanel;
    const { loadRaffles } = rafflesPanel;
    const { loadRequests } = requestsPanel;
    const { loadProfile } = profilePanel;

    useEffect(() => {
        const timer = window.setTimeout(() => {
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
        }, 0);

        return () => window.clearTimeout(timer);
    }, [activePage, loadEvents, loadRaffles, loadRequests, loadUsers]);

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
                return;
            }

            if (activePage === "profile") {
                void loadProfile();
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
    }, [
        activePage,
        loadEvents,
        loadProfile,
        loadRaffles,
        loadRequests,
        loadUsers,
    ]);

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

    return (
        <AdminLayout
            activePage={activePage}
            displayName={displayName}
            isLoggingOut={isLoggingOut}
            onLogout={handleLogout}
        >
            {activePage === "users" && (
                <UsersPanel
                    users={usersPanel.users}
                    total={usersPanel.total}
                    page={usersPanel.page}
                    pages={usersPanel.pages}
                    pageLabel={usersPanel.pageLabel}
                    isLoading={usersPanel.isLoading}
                    currentUserId={usersPanel.currentUserId}
                    updatingUserId={usersPanel.updatingUserId}
                    canGoPrevious={usersPanel.canGoPrevious}
                    canGoNext={usersPanel.canGoNext}
                    setPage={usersPanel.setPage}
                    onRefresh={() => void usersPanel.loadUsers()}
                    onRoleChange={(user, role) => void usersPanel.handleRoleChange(user, role)}
                />
            )}

            {activePage === "events" && (
                <EventsPanel
                    key={eventsPanel.eventFormResetKey}
                    allEvents={eventsPanel.allEvents}
                    myEvents={eventsPanel.myEvents}
                    categories={eventsPanel.eventCategories}
                    categoriesStatus={eventsPanel.eventCategoriesStatus}
                    isLoading={eventsPanel.isEventsLoading}
                    isCreatingEvent={eventsPanel.isCreatingEvent}
                    isLoadingSelectedEvent={eventsPanel.isLoadingSelectedEvent}
                    deletingEventId={eventsPanel.deletingEventId}
                    editingEventId={eventsPanel.editingEventId}
                    eventForm={eventsPanel.eventForm}
                    publishedEvents={eventsPanel.allEvents.filter((event) => event.status.toLowerCase() === "publicado").length}
                    cancelledEvents={eventsPanel.allEvents.filter((event) => event.status.toLowerCase() === "cancelado").length}
                    onRefresh={() => void eventsPanel.loadEvents()}
                    onCreateEvent={(event, tickets) => void eventsPanel.handleCreateEvent(event, tickets)}
                    onEditEvent={(event) => void eventsPanel.handleEditEvent(event)}
                    onDeleteEvent={(event) => void eventsPanel.handleDeleteEvent(event)}
                    onCancelEdit={eventsPanel.handleCancelEdit}
                />
            )}

            {activePage === "raffles" && (
                <RafflesPanel
                    raffles={rafflesPanel.raffleList}
                    featuredRaffles={rafflesPanel.featuredRaffles}
                    totalRaffleTickets={rafflesPanel.totalRaffleTickets}
                    editingRaffle={rafflesPanel.editingRaffle}
                    isLoading={rafflesPanel.isRafflesLoading}
                    processingRaffleId={rafflesPanel.processingRaffleId}
                    onSubmitRaffle={(event) => void rafflesPanel.handleSubmitRaffle(event)}
                    onEditRaffle={rafflesPanel.setEditingRaffle}
                    onCancelEdit={() => rafflesPanel.setEditingRaffle(null)}
                    onDeleteRaffle={(raffle) => void rafflesPanel.handleDeleteRaffle(raffle)}
                    onRefresh={() => void rafflesPanel.loadRaffles()}
                />
            )}

            {activePage === "requests" && (
                <RequestsPanel
                    requests={requestsPanel.requests}
                    requestStatus={requestsPanel.requestStatus}
                    isLoading={requestsPanel.isRequestsLoading}
                    pendingRequests={requestsPanel.pendingRequests}
                    processingRequestId={requestsPanel.processingRequestId}
                    onStatusChange={requestsPanel.setRequestStatus}
                    onRefresh={() => void requestsPanel.loadRequests()}
                    onApprove={(requestId) => void requestsPanel.handleApproveRequest(requestId)}
                    onReject={(requestId) => void requestsPanel.handleRejectRequest(requestId)}
                />
            )}

            {activePage === "profile" && (
                <AdminProfilePanel
                    profile={profilePanel.profile}
                    profileName={profilePanel.profileName}
                    isLoading={profilePanel.isProfileLoading}
                    isDeletingAccount={profilePanel.isDeletingAccount}
                    onDeleteAccount={() => void profilePanel.handleDeleteAccount()}
                />
            )}
        </AdminLayout>
    );
}
