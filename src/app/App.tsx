import { Header } from "../widgets/header/ui/header";
//import { LandingPage } from "../pages/landing";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";
//import { routes } from "./router/routes";
import "./styles/index.css";

export function App() {
    // const showProductApp = window.location.pathname.startsWith(routes.app);

    // if (!showProductApp) {
    //     return <LandingPage />;
    // }

    return (
        <>
            <Header />

            <AppProviders>
                <AppRouter />
            </AppProviders>

        </>
    );
}

export default App;
