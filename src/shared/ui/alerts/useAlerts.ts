import { useContext } from "react";
import { AlertsContext } from "./alertsContext";

export function useAlerts() {
    const context = useContext(AlertsContext);

    if (!context) {
        throw new Error("useAlerts debe usarse dentro de AlertsProvider.");
    }

    return context;
}
