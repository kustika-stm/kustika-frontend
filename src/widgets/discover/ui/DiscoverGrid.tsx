import { routes } from "../../../app/router/routes";
import bg from "../../../shared/assets/images/hero/hero.jpg";
import styles from "./discover-grid.module.css";

const categories = [
    {
        className: styles.one,
        href: routes.categoryDetail("musica"),
        label: "Conciertos y noches en vivo",
        title: "Música",
    },
    {
        className: styles.two,
        href: routes.categoryDetail("comedia"),
        label: "Shows para reir",
        title: "Comedia",
    },
    {
        className: styles.three,
        href: routes.categoryDetail("musica-latina"),
        label: "Baile y energía",
        title: "Música latina",
    },
    {
        className: styles.four,
        href: routes.categoryDetail("regional"),
        label: "Fiesta con identidad",
        title: "Regional",
    },
];

export function DiscoverGrid() {
    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2>Explora por categorías</h2>
                <span>Encuentra eventos por el plan que traes en mente</span>
            </div>

            <div className={styles.grid}>
                {categories.map((category) => (
                    <a
                        className={`${styles.card} ${category.className}`}
                        href={category.href}
                        key={category.href}
                        style={{ backgroundImage: `url(${bg})` }}
                    >
                        <div className={styles.overlay} />
                        <div className={styles.content}>
                            <span className={styles.tag}>{category.label}</span>
                            <h3>{category.title}</h3>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
