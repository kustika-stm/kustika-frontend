import type { ReactNode } from "react";
import { AdminPage } from "../../pages/admin";
import { HomePage } from "../../pages/home";
import { CategoriesPage } from "../../pages/categories";
import { EventsPage } from "../../pages/events";
import { EventDetailPage } from "../../pages/event-detail";
import { EventCustomerPage } from "../../pages/event-customer";
import { CheckoutPage } from "../../pages/checkout";
import { LoginPage } from "../../pages/login";
import { MyTicketsPage } from "../../pages/my-tickets";
import { ProfilePage } from "../../pages/profile";
import { RegisterPage } from "../../pages/register";
import { getRoleHomePath, getSessionRole, getStoredSession, type UserRole } from "../../entities/session";
import { routes } from "./routes";

type RoleAccessProps = {
    allowedRole: UserRole;
    children: ReactNode;
};

function RoleAccess({ allowedRole, children }: RoleAccessProps) {
    const session = getStoredSession();
    const role = getSessionRole(session);

    if (!session?.accessToken) {
        window.location.assign(routes.login);
        return null;
    }

    if (role !== allowedRole) {
        window.location.assign(getRoleHomePath(role));
        return null;
    }

    return children;
}

export function AppRouter() {
    const pathname = window.location.pathname;

    if (pathname === routes.login) {
        return <LoginPage />;
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

    if (pathname === routes.admin) {
        return (
            <RoleAccess allowedRole="admin">
                <AdminPage />
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
