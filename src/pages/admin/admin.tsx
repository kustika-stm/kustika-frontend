import { routes } from "../../app/router/routes";
import styles from "./admin.module.css";

const userFilters = ["Todos", "Customer", "Event customer", "Admin"];

export function AdminPage() {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span className={styles.eyebrow}>Administrador</span>
                    <h1>Gestion de usuarios</h1>
                    <p>Administra roles, accesos y estado de cuentas desde un panel separado del flujo de compra.</p>
                </div>

                <a className={styles.secondaryAction} href={routes.profile}>Ver perfil</a>
            </section>

            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div>
                        <span className={styles.eyebrow}>Usuarios</span>
                        <h2>Cuentas registradas</h2>
                    </div>
                    <button type="button">Actualizar</button>
                </div>

                <div className={styles.toolbar}>
                    <label>
                        Buscar usuario
                        <input type="search" placeholder="Nombre o correo" />
                    </label>

                    <div className={styles.filters} aria-label="Filtrar por rol">
                        {userFilters.map((filter) => (
                            <button type="button" key={filter}>{filter}</button>
                        ))}
                    </div>
                </div>

                <div className={styles.emptyState}>
                    <strong>No hay usuarios cargados</strong>
                    <p>Cuando exista el endpoint de usuarios, esta tabla mostrara cuentas, roles y acciones de administracion.</p>
                </div>
            </section>
        </main>
    );
}
