import { useMemo, useState } from "react";
import { routes } from "../../app/router/routes";
import { EventSearchBar } from "../../features/event-search";
import { usePublicEvents } from "../../features/events/model";
import styles from "./events.module.css";

const statusLabels = {
    all: "Todos",
    available: "Disponibles",
    soon: "Proximamente",
    "sold-out": "Agotados",
} as const;

type StatusFilter = keyof typeof statusLabels;

const eventStatusLabel = {
    available: "Disponible",
    soon: "Proximamente",
    "sold-out": "Agotado",
} as const;

export function EventsPage() {
    const searchQuery = new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
    const { events, isLoading, error } = usePublicEvents();
    const [city, setCity] = useState("all");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState<StatusFilter>("all");

    const cities = useMemo(() => {
        return ["all", ...Array.from(new Set(events.map((event) => event.location)))];
    }, [events]);

    const categories = useMemo(() => {
        return ["all", ...Array.from(new Set(events.map((event) => event.category)))];
    }, [events]);

    const filteredEvents = events.filter((event) => {
        const normalizedQuery = searchQuery.toLowerCase();
        const searchableText = [
            event.title,
            event.subtitle,
            event.description,
            event.location,
            event.city,
            event.venueName,
            event.category,
            ...event.tags,
        ].join(" ").toLowerCase();
        const matchesCity = city === "all" || event.location === city;
        const matchesCategory = category === "all" || event.category === category;
        const matchesStatus = status === "all" || event.status === status;
        const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);

        return matchesSearch && matchesCity && matchesCategory && matchesStatus;
    });

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span>Eventos Evenxa</span>
                    <h1>Encuentra tu proxima experiencia</h1>
                    <p>
                        Explora conciertos, festivales y experiencias seleccionadas para vivir la ciudad de otra forma.
                    </p>
                </div>
            </section>

            <section className={styles.searchSection} aria-label="Buscar eventos">
                <EventSearchBar defaultValue={searchQuery} compact />
            </section>

            <section className={styles.toolbar} aria-label="Filtros de eventos">
                <label>
                    Ciudad
                    <select value={city} onChange={(event) => setCity(event.target.value)}>
                        {cities.map((option) => (
                            <option value={option} key={option}>
                                {option === "all" ? "Todas" : option}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Categoria
                    <select value={category} onChange={(event) => setCategory(event.target.value)}>
                        {categories.map((option) => (
                            <option value={option} key={option}>
                                {option === "all" ? "Todas" : option}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Estado
                    <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                        {Object.entries(statusLabels).map(([value, label]) => (
                            <option value={value} key={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
            </section>

            <section className={styles.results} aria-labelledby="events-title">
                <div className={styles.resultsHeader}>
                    <div>
                        <h2 id="events-title">{searchQuery ? `Resultados para "${searchQuery}"` : "Todos los eventos"}</h2>
                        <p>{filteredEvents.length} evento{filteredEvents.length === 1 ? "" : "s"} disponible{filteredEvents.length === 1 ? "" : "s"}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}>
                        <h3>Cargando eventos...</h3>
                        <p>Estamos consultando los eventos publicados.</p>
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <h3>No pudimos cargar los eventos.</h3>
                        <p>{error}</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className={styles.list}>
                        {filteredEvents.map((event) => (
                            <article className={styles.eventRow} key={event.id}>
                                <a
                                    className={styles.eventImage}
                                    href={routes.eventDetail(event.id)}
                                    aria-label={`Ver detalle de ${event.title}`}
                                >
                                    <img src={event.image} alt={event.title} />
                                </a>

                                <div className={styles.eventInfo}>
                                    <div className={styles.eventMeta}>
                                        <span>{event.date}</span>
                                        <span>{event.time}</span>
                                        <span>{event.category}</span>
                                    </div>

                                    <h3>
                                        <a href={routes.eventDetail(event.id)}>{event.title}</a>
                                    </h3>

                                    <p>{event.location} - {event.venueName}</p>

                                    <div className={styles.eventTags}>
                                        <span>{eventStatusLabel[event.status]}</span>
                                        {event.tags.slice(0, 2).map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <a className={styles.rowCta} href={routes.eventDetail(event.id)}>
                                    Ver detalles
                                </a>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No encontramos eventos con esos filtros.</h3>
                        <p>Prueba otra ciudad, categoria o estado.</p>
                    </div>
                )}
            </section>
        </main>
    );
}
