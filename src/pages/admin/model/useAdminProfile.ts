import { useCallback, useEffect, useState } from "react";
import { routes } from "../../../app/router/routes";
import { clearSession, getStoredSession, saveSession, type SessionUser } from "../../../entities/session";
import { profileApi } from "../../../features/profile/api";
import { useAlerts } from "../../../shared/ui/alerts";
import type { AdminPageName } from "./adminUtils";

type Params = {
    activePage: AdminPageName;
    displayName: string;
    getCurrentToken: () => string;
    initialProfile: SessionUser | null;
};

export function useAdminProfile({ activePage, displayName, getCurrentToken, initialProfile }: Params) {
    const alerts = useAlerts();
    const [profile, setProfile] = useState<SessionUser | null>(initialProfile);
    const [isProfileLoading, setIsProfileLoading] = useState(activePage === "profile");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const profileName = [profile?.nombre, profile?.apellido_paterno, profile?.apellido_materno].filter(Boolean).join(" ") || profile?.email || displayName;

    const loadProfile = useCallback(async () => {
        const currentToken = getCurrentToken();

        if (!currentToken || activePage !== "profile") {
            return;
        }

        setIsProfileLoading(true);

        try {
            const userProfile = await profileApi.getProfile(currentToken);
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
        } catch (error) {
            alerts.notify({
                tone: "error",
                title: "Perfil no disponible",
                message: error instanceof Error ? error.message : "No pudimos cargar tu perfil.",
            });
        } finally {
            setIsProfileLoading(false);
        }
    }, [activePage, alerts, getCurrentToken]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadProfile();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadProfile]);

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

    return {
        profile,
        profileName,
        isProfileLoading,
        isDeletingAccount,
        loadProfile,
        handleDeleteAccount,
    };
}
