import { Footer } from "../widgets/footer";
import { Header } from "../widgets/header/ui/header";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { routes } from "./router/routes";
import "./styles/index.css";

export function App() {
    const pathname = window.location.pathname;
    const authRoutes: string[] = [routes.login, routes.register, routes.recoverPassword, routes.googleCallback];
    const isAuthRoute = authRoutes.includes(pathname);
    const isAdminRoute = pathname === routes.admin || pathname.startsWith(`${routes.admin}/`);

    return (
        <AppProviders>
            {!isAuthRoute && !isAdminRoute && <Header />}

            <AppRouter />

            {!isAuthRoute && !isAdminRoute && <Footer />}
        </AppProviders>
    );
}

export default App;
