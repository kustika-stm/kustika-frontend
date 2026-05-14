import { useState, type FormEvent } from "react";
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
    const isRegister = props.mode === "register";
    const [formError, setFormError] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");

        if (isRegister) {
            const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

            if (password !== passwordConfirm) {
                setFormError("Las contrasenas no coinciden.");
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
                        <input name="nombre" type="text" placeholder="Ej. Juan" required />
                    </label>

                    <label className={styles.field}>
                        <span>Apellido paterno</span>
                        <input name="apellido_paterno" type="text" placeholder="Ej. Garcia" required />
                    </label>

                    <label className={styles.field}>
                        <span>Apellido materno</span>
                        <input name="apellido_materno" type="text" placeholder="Ej. Lopez" required />
                    </label>

                    <label className={styles.field}>
                        <span>Telefono</span>
                        <input name="telefono" type="tel" placeholder="4421234567" required />
                    </label>
                </>
            )}

            <label className={styles.field}>
                <span>Correo electronico</span>
                <input name="email" type="email" placeholder="tu@email.com" required />
            </label>

            <label className={styles.field}>
                <span>Contrasena</span>
                <input name="password" type="password" placeholder="Tu contrasena" required />
            </label>

            {isRegister && (
                <label className={styles.field}>
                    <span>Confirmar contrasena</span>
                    <input name="passwordConfirm" type="password" placeholder="Repite tu contrasena" required />
                </label>
            )}

            {formError && <p className={styles.error}>{formError}</p>}

            <button className={styles.submit} type="submit" disabled={props.isLoading}>
                {props.isLoading ? "Procesando..." : isRegister ? "Crear cuenta" : "Iniciar sesion"}
            </button>
        </form>
    );
}
