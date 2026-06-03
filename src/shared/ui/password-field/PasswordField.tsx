import { useState, type InputHTMLAttributes } from "react";
import eyeIcon from "../../assets/icons/ojo.png";
import eyeClosedIcon from "../../assets/icons/ojo_cerrado.png";
import styles from "./password-field.module.css";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordField(props: PasswordFieldProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span className={styles.control}>
            <input {...props} type={isVisible ? "text" : "password"} />
            <button
                type="button"
                className={styles.toggle}
                aria-label={isVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
                onClick={() => setIsVisible((current) => !current)}
            >
                <img src={isVisible ? eyeIcon : eyeClosedIcon} alt="" aria-hidden="true" />
            </button>
        </span>
    );
}
