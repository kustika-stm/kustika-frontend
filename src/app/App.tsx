import { Header } from "../widgets/header/ui/header";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import "./styles/index.css";

export function App() {
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