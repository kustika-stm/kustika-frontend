import type { ReactNode } from "react";
import { AdminPage } from "../../pages/admin";
import { HomePage } from "../../pages/home";
import { CategoriesPage } from "../../pages/categories";
import { EventsPage } from "../../pages/events";
import { EventDetailPage } from "../../pages/event-detail";
import { EventCustomerPage } from "../../pages/event-customer";
import { CheckoutPage } from "../../pages/checkout";
import { GoogleCallbackPage, LoginPage } from "../../pages/login";
import { MyTicketsPage } from "../../pages/my-tickets";
import { OrganizerRequestPage } from "../../pages/organizer-request";
import { ProfilePage } from "../../pages/profile";
import { RecoverPasswordPage } from "../../pages/recover-password";
import { RegisterPage } from "../../pages/register";
import { getRoleHomePath, getSessionRole, getStoredSession, getTokenRole, type UserRole } from "../../entities/session";
import { routes } from "./routes";

type RoleAccessProps = {
    allowedRole: UserRole;
    children: ReactNode;
};

function RoleAccess({ allowedRole, children }: RoleAccessProps) {
    const session = getStoredSession();
    const role = getTokenRole(session?.accessToken) ?? getSessionRole(session);

    if (!session?.accessToken) {
        window.location.assign(allowedRole === "admin" ? routes.home : routes.login);
        return null;
    }

    if (role !== allowedRole) {
        window.location.assign(allowedRole === "admin" ? routes.home : getRoleHomePath(role));
        return null;
    }

    return children;
}

export function AppRouter() {
    const pathname = window.location.pathname;

    if (pathname === routes.login) {
        return <LoginPage />;
    }

    if (pathname === routes.googleCallback) {
        return <GoogleCallbackPage />;
    }

    if (pathname === routes.recoverPassword) {
        return <RecoverPasswordPage />;
    }

    if (pathname === routes.register) {
        return <RegisterPage />;
    }

    if (pathname === routes.eventCustomer) {
        return (
            <RoleAccess allowedRole="event_customer">
                <EventCustomerPage />
            </RoleAccess>
        );
    }

    if (pathname === routes.admin || pathname === routes.adminProfile || pathname === routes.adminRequests) {
        return (
            <RoleAccess allowedRole="admin">
                <AdminPage page={pathname === routes.adminProfile ? "profile" : pathname === routes.adminRequests ? "requests" : "users"} />
            </RoleAccess>
        );
    }

    if (pathname === routes.events) {
        return <EventsPage />;
    }

    if (pathname === routes.categories) {
        return <CategoriesPage />;
    }

    if (pathname === routes.myTickets) {
        return <MyTicketsPage />;
    }

    if (pathname === routes.organizerRequest) {
        return <OrganizerRequestPage />;
    }

    if (pathname === routes.profile || pathname === routes.editProfile) {
        return <ProfilePage mode={pathname === routes.editProfile ? "edit" : "view"} />;
    }

    if (pathname.startsWith(`${routes.categoryDetailBase}/`)) {
        const categoryId = decodeURIComponent(pathname.replace(`${routes.categoryDetailBase}/`, ""));

        return <CategoriesPage categoryId={categoryId} />;
    }

    if (pathname.startsWith(`${routes.eventDetailBase}/`) && pathname.endsWith("/comprar")) {
        const eventId = decodeURIComponent(
            pathname
                .replace(`${routes.eventDetailBase}/`, "")
                .replace(/\/comprar$/, ""),
        );

        return <CheckoutPage eventId={eventId} />;
    }

    if (pathname.startsWith(`${routes.eventDetailBase}/`)) {
        const eventId = decodeURIComponent(pathname.replace(`${routes.eventDetailBase}/`, ""));

        return <EventDetailPage eventId={eventId} />;
    }

    return <HomePage />;
}
