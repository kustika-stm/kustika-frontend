//Para que aparezca el landing, se comenta el router y se importa el landing, luego se descomenta el router y se comenta el landing

import { Header } from "../widgets/header/ui/header";
import { Footer } from "../widgets/footer";
//import { LandingPage } from "../pages/landing";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { routes } from "./router/routes";
import "./styles/index.css";

export function App() {
    // const showProductApp = window.location.pathname.startsWith(routes.app);
    const pathname = window.location.pathname;
    const hideFooter = pathname === routes.login || pathname === routes.register;

    // if (!showProductApp) {
    //     return <LandingPage />;
    // }

    return (
        <>
            <Header />

            <AppProviders>
                <AppRouter />
            </AppProviders>

            {!hideFooter && <Footer />}
        </>
    );
}

export default App;
