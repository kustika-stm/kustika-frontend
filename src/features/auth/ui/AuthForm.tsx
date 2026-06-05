import { type FormEvent } from "react";
import { useAlerts } from "../../../shared/ui/alerts";
import { PasswordField } from "../../../shared/ui/password-field";
import styles from "./auth-form.module.css";

export type AuthMode = "login" | "register";

export type LoginFormValues = {
    email: string;
    password: string;
};

export type RegisterFormValues = LoginFormValues & {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    telefono: string;
};

type Props =
    | {
        mode: "login";
        onSubmit: (values: LoginFormValues) => void;
        isLoading?: boolean;
    }
    | {
        mode: "register";
        onSubmit: (values: RegisterFormValues) => void;
        isLoading?: boolean;
    };

export function AuthForm(props: Props) {
    const alerts = useAlerts();
    const isRegister = props.mode === "register";

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");

        if (isRegister) {
            const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

            if (password.length < 8) {
                alerts.notify({
                    tone: "error",
                    title: "Contraseña inválida",
                    message: "La contraseña debe tener al menos 8 caracteres.",
                });
                return;
            }

            if (password !== passwordConfirm) {
                alerts.notify({
                    tone: "error",
                    title: "Contraseñas distintas",
                    message: "Las contraseñas no coinciden.",
                });
                return;
            }

            props.onSubmit({
                nombre: String(formData.get("nombre") ?? ""),
                apellido_paterno: String(formData.get("apellido_paterno") ?? ""),
                apellido_materno: String(formData.get("apellido_materno") ?? ""),
                telefono: String(formData.get("telefono") ?? ""),
                email,
                password,
            });
            return;
        }

        props.onSubmit({ email, password });
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {isRegister && (
                <>
                    <label className={styles.field}>
                        <span>Nombre</span>
                        <input name="nombre" type="text" placeholder="Ej. Juan" autoComplete="given-name" required />
                    </label>

                    <label className={styles.field}>
                        <span>Apellido paterno</span>
                        <input name="apellido_paterno" type="text" placeholder="Ej. García" autoComplete="family-name" required />
                    </label>

                    <label className={styles.field}>
                        <span>Apellido materno</span>
                        <input name="apellido_materno" type="text" placeholder="Ej. López" required />
                    </label>

                    <label className={styles.field}>
                        <span>Teléfono</span>
                        <input name="telefono" type="tel" placeholder="4421234567" autoComplete="tel" required />
                    </label>
                </>
            )}

            <label className={styles.field}>
                <span>Correo electrónico</span>
                <input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
            </label>

            <label className={styles.field}>
                <span>Contraseña</span>
                <PasswordField
                    name="password"
                    placeholder="Tu contraseña"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    minLength={8}
                    required
                />
            </label>

            {isRegister && (
                <label className={styles.field}>
                    <span>Confirmar contraseña</span>
                    <PasswordField
                        name="passwordConfirm"
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>
            )}

            <button className={styles.submit} type="submit" disabled={props.isLoading}>
                {props.isLoading ? "Procesando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </button>
        </form>
    );
}
