import { type ReactNode } from "react";
import { AlertsProvider } from "../../shared/ui/alerts";

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return <AlertsProvider>{children}</AlertsProvider>;
}
