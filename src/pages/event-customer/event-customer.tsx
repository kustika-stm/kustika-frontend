import { routes } from "../../app/router/routes";
import styles from "./event-customer.module.css";

const eventFields = [
    { label: "Nombre del evento", name: "name", type: "text" },
    { label: "Fecha", name: "date", type: "date" },
    { label: "Hora", name: "time", type: "time" },
    { label: "Lugar", name: "venue", type: "text" },
    { label: "Ciudad", name: "city", type: "text" },
    { label: "Precio base", name: "price", type: "number" },
];

export function EventCustomerPage() {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span className={styles.eyebrow}>Panel de eventos</span>
                    <h1>Publica y administra tus eventos</h1>
                    <p>Prepara la informacion que tus clientes veran antes de comprar boletos en Evenxa.</p>
                </div>

                <a className={styles.secondaryAction} href={routes.profile}>Ver perfil</a>
            </section>

            <section className={styles.layout}>
                <form className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Nuevo evento</span>
                            <h2>Datos principales</h2>
                        </div>
                        <button type="button">Guardar borrador</button>
                    </div>

                    <div className={styles.formGrid}>
                        {eventFields.map((field) => (
                            <label key={field.name}>
                                {field.label}
                                <input name={field.name} type={field.type} min={field.type === "number" ? "0" : undefined} />
                            </label>
                        ))}

                        <label className={styles.fullField}>
                            Descripcion
                            <textarea name="description" rows={5} />
                        </label>
                    </div>
                </form>

                <aside className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span className={styles.eyebrow}>Mis eventos</span>
                            <h2>Eventos publicados</h2>
                        </div>
                    </div>

                    <div className={styles.emptyState}>
                        <strong>Aun no tienes eventos publicados</strong>
                        <p>Cuando el backend entregue tus eventos, apareceran aqui para editarlos y revisar su estado.</p>
                    </div>
                </aside>
            </section>
        </main>
    );
}
