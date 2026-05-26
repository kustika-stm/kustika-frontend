import { type FormEvent, type ReactNode, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    AlertsContext,
    type AlertTone,
    type BaseAlertOptions,
    type NotifyOptions,
    type PromptOptions,
} from "./alertsContext";
import styles from "./alerts.module.css";

type AlertRequest =
    | (BaseAlertOptions & {
        id: number;
        kind: "alert";
        resolve: () => void;
    })
    | (BaseAlertOptions & {
        id: number;
        kind: "confirm";
        resolve: (value: boolean) => void;
    })
    | (PromptOptions & {
        id: number;
        kind: "prompt";
        resolve: (value: string | null) => void;
    });

type ToastItem = NotifyOptions & {
    id: number;
    tone: AlertTone;
};

const toneLabel: Record<AlertTone, string> = {
    info: "Info",
    success: "OK",
    warning: "!",
    error: "X",
};

let nextAlertId = 1;

export function AlertsProvider({ children }: { children: ReactNode }) {
    const [requests, setRequests] = useState<AlertRequest[]>([]);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const activeRequest = requests[0];

    const removeRequest = useCallback((id: number) => {
        setRequests((current) => current.filter((request) => request.id !== id));
    }, []);

    const enqueue = useCallback((request: AlertRequest) => {
        setRequests((current) => [...current, request]);
    }, []);

    const alert = useCallback((options: BaseAlertOptions) => {
        return new Promise<void>((resolve) => {
            enqueue({
                ...options,
                id: nextAlertId++,
                kind: "alert",
                resolve,
            });
        });
    }, [enqueue]);

    const confirm = useCallback((options: BaseAlertOptions) => {
        return new Promise<boolean>((resolve) => {
            enqueue({
                ...options,
                id: nextAlertId++,
                kind: "confirm",
                resolve,
            });
        });
    }, [enqueue]);

    const prompt = useCallback((options: PromptOptions) => {
        return new Promise<string | null>((resolve) => {
            enqueue({
                ...options,
                id: nextAlertId++,
                kind: "prompt",
                resolve,
            });
        });
    }, [enqueue]);

    const dismissToast = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback((options: NotifyOptions) => {
        const id = nextAlertId++;
        const durationMs = options.durationMs ?? 4200;

        setToasts((current) => [
            ...current,
            {
                ...options,
                id,
                tone: options.tone ?? "info",
            },
        ]);

        if (durationMs > 0) {
            window.setTimeout(() => dismissToast(id), durationMs);
        }
    }, [dismissToast]);

    const contextValue = useMemo(() => ({ alert, confirm, prompt, notify }), [alert, confirm, notify, prompt]);

    const handleCancel = () => {
        if (!activeRequest) {
            return;
        }

        if (activeRequest.kind === "alert") {
            activeRequest.resolve();
        } else if (activeRequest.kind === "confirm") {
            activeRequest.resolve(false);
        } else {
            activeRequest.resolve(null);
        }

        removeRequest(activeRequest.id);
    };

    const handleConfirm = (value?: string) => {
        if (!activeRequest) {
            return;
        }

        if (activeRequest.kind === "alert") {
            activeRequest.resolve();
        } else if (activeRequest.kind === "confirm") {
            activeRequest.resolve(true);
        } else {
            activeRequest.resolve(value ?? "");
        }

        removeRequest(activeRequest.id);
    };

    return (
        <AlertsContext.Provider value={contextValue}>
            {children}
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
            {activeRequest && (
                <AlertDialog
                    key={activeRequest.id}
                    request={activeRequest}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                />
            )}
        </AlertsContext.Provider>
    );
}

function ToastStack({
    toasts,
    onDismiss,
}: {
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
}) {
    if (!toasts.length) {
        return null;
    }

    return createPortal(
        <div className={styles.toastStack} aria-live="polite" aria-label="Notificaciones">
            {toasts.map((toast) => (
                <article className={`${styles.toast} ${styles[toast.tone]}`} key={toast.id}>
                    <div className={styles.toastIcon} aria-hidden="true">
                        {toneLabel[toast.tone]}
                    </div>
                    <div>
                        {toast.title && <strong>{toast.title}</strong>}
                        <p>{toast.message}</p>
                    </div>
                    <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Cerrar notificacion">
                        X
                    </button>
                </article>
            ))}
        </div>,
        document.body,
    );
}

function AlertDialog({
    request,
    onCancel,
    onConfirm,
}: {
    request: AlertRequest;
    onCancel: () => void;
    onConfirm: (value?: string) => void;
}) {
    const [promptValue, setPromptValue] = useState(request.kind === "prompt" ? request.defaultValue ?? "" : "");
    const tone = request.tone ?? "info";
    const isPrompt = request.kind === "prompt";
    const isConfirm = request.kind === "confirm";

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isPrompt) {
            onConfirm(promptValue.trim());
            return;
        }

        onConfirm();
    };

    return createPortal(
        <div className={styles.overlay} role="presentation" onMouseDown={onCancel}>
            <form
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`alert-title-${request.id}`}
                onMouseDown={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
                    {toneLabel[tone]}
                </div>

                <div className={styles.content}>
                    <h2 id={`alert-title-${request.id}`}>{request.title}</h2>
                    {request.message && <p>{request.message}</p>}

                    {isPrompt && (
                        <label className={styles.promptField}>
                            {request.label ?? "Descripcion"}
                            <textarea
                                autoFocus
                                rows={4}
                                value={promptValue}
                                placeholder={request.placeholder}
                                required={request.required}
                                onChange={(event) => setPromptValue(event.target.value)}
                            />
                        </label>
                    )}
                </div>

                <div className={styles.actions}>
                    {(isConfirm || isPrompt) && (
                        <button className={styles.secondaryButton} type="button" onClick={onCancel}>
                            {request.cancelLabel ?? "Cancelar"}
                        </button>
                    )}
                    <button className={`${styles.primaryButton} ${styles[tone]}`} type="submit" autoFocus={!isPrompt}>
                        {request.confirmLabel ?? (isPrompt ? "Aceptar" : "Entendido")}
                    </button>
                </div>
            </form>
        </div>,
        document.body,
    );
}
