import { createContext } from "react";

export type AlertTone = "info" | "success" | "warning" | "error";

export type BaseAlertOptions = {
    tone?: AlertTone;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
};

export type PromptOptions = BaseAlertOptions & {
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
};

export type NotifyOptions = {
    tone?: AlertTone;
    title?: string;
    message: string;
    durationMs?: number;
};

export type AlertsContextValue = {
    alert: (options: BaseAlertOptions) => Promise<void>;
    confirm: (options: BaseAlertOptions) => Promise<boolean>;
    prompt: (options: PromptOptions) => Promise<string | null>;
    notify: (options: NotifyOptions) => void;
};

export const AlertsContext = createContext<AlertsContextValue | null>(null);
