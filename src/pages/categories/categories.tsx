import { routes } from "../../app/router/routes";
import type { Event } from "../../entities/event/model/event";
import { usePublicEvents } from "../../features/events/model";
import heroImage from "../../shared/assets/images/hero/hero.jpg";
import styles from "./categories.module.css";

type Props = {
    categoryId?: string;
};

type Category = {
    id: string;
    name: string;
    description: string;
    searchTerms: string[];
};

const categories: Category[] = [
    {
        id: "musica",
        name: "Musica",
        description: "Conciertos, sesiones en vivo y noches con energia sonora.",
        searchTerms: ["musica", "electronica", "indie", "live", "concierto", "festival"],
    },
    {
        id: "musica-latina",
        name: "Musica latina",
        description: "Ritmos latinos, baile y experiencias para celebrar.",
        searchTerms: ["latino", "baile", "mestiza", "concierto"],
    },
    {
        id: "regional",
        name: "Regional",
        description: "Eventos con identidad local, fiesta y sonidos de raiz.",
        searchTerms: ["regional", "festival", "mexico"],
    },
    {
        id: "comedia",
        name: "Comedia",
        description: "Noches para reir, compartir y descubrir talento en vivo.",
        searchTerms: ["comedia", "standup", "show"],
    },
    {
        id: "experiencias",
        name: "Experiencias",
        description: "Tours, rutas y planes especiales fuera del formato clasico.",
        searchTerms: ["experiencias", "tour", "urbano", "noche"],
    },
    {
        id: "festival",
        name: "Festival",
        description: "Lineups, comida, mercado y eventos para pasar el dia completo.",
        searchTerms: ["festival", "food", "market", "indie"],
    },
];

const normalize = (value: string) => value.toLowerCase();

const getCategoryEvents = (category: Category, events: Event[]) => {
    return events.filter((event) => {
        const searchableText = [
            event.category,
            event.title,
            event.subtitle,
            event.description,
            ...event.tags,
        ].join(" ").toLowerCase();

        return category.searchTerms.some((term) => searchableText.includes(normalize(term)));
    });
};

export function CategoriesPage({ categoryId }: Props) {
    const { events, isLoading, error } = usePublicEvents();
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const visibleCategories = selectedCategory ? [selectedCategory] : categories;

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span>Categorias</span>
                    <h1>{selectedCategory ? selectedCategory.name : "Explora por tipo de evento"}</h1>
                    <p>
                        {selectedCategory
                            ? selectedCategory.description
                            : "Encuentra experiencias por genero, energia y plan. Entra a una categoria para ver eventos relacionados."}
                    </p>
                </div>
            </section>

            {!selectedCategory && (
                <section className={styles.categoryGrid} aria-label="Categorias de eventos">
                    {categories.map((category) => {
                        const categoryEvents = getCategoryEvents(category, events);
                        const coverImage = categoryEvents[0]?.image ?? heroImage;

                        return (
                            <a
                                className={styles.categoryCard}
                                href={routes.categoryDetail(category.id)}
                                key={category.id}
                                style={{ backgroundImage: `url(${coverImage})` }}
                            >
                                <div className={styles.cardShade} />
                                <div>
                                    <span>{categoryEvents.length} evento{categoryEvents.length === 1 ? "" : "s"}</span>
                                    <h2>{category.name}</h2>
                                    <p>{category.description}</p>
                                </div>
                            </a>
                        );
                    })}
                </section>
            )}

            {visibleCategories.map((category) => {
                const categoryEvents = getCategoryEvents(category, events);

                return (
                    <section className={styles.eventGroup} key={category.id}>
                        <div className={styles.groupHeader}>
                            <div>
                                <span>{category.name}</span>
                                <h2>Eventos relacionados</h2>
                            </div>

                            <a href={`${routes.events}?q=${encodeURIComponent(category.name)}`}>Ver todo</a>
                        </div>

                        {isLoading ? (
                            <div className={styles.emptyState}>
                                <h3>Cargando eventos...</h3>
                                <p>Estamos consultando los eventos publicados.</p>
                            </div>
                        ) : error ? (
                            <div className={styles.emptyState}>
                                <h3>No pudimos cargar eventos.</h3>
                                <p>{error}</p>
                            </div>
                        ) : categoryEvents.length > 0 ? (
                            <div className={styles.eventList}>
                                {categoryEvents.map((event) => (
                                    <article className={styles.eventRow} key={event.id}>
                                        <a className={styles.eventImage} href={routes.eventDetail(event.id)}>
                                            <img src={event.image} alt={event.title} />
                                        </a>

                                        <div className={styles.eventInfo}>
                                            <div className={styles.eventMeta}>
                                                <span>{event.date}</span>
                                                <span>{event.time}</span>
                                                <span>{event.location}</span>
                                            </div>

                                            <h3>
                                                <a href={routes.eventDetail(event.id)}>{event.title}</a>
                                            </h3>

                                            <p>{event.venueName}</p>
                                        </div>

                                        <a className={styles.eventCta} href={routes.eventDetail(event.id)}>
                                            Ver detalles
                                        </a>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3>Aun no hay eventos en esta categoria.</h3>
                                <p>Pronto agregaremos nuevas experiencias.</p>
                            </div>
                        )}
                    </section>
                );
            })}
        </main>
    );
}
