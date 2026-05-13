import { type FormEvent, useState } from "react";
import { routes } from "../../../app/router/routes";
import styles from "./event-search-bar.module.css";

type Props = {
    defaultValue?: string;
    compact?: boolean;
};

export function EventSearchBar({ defaultValue = "", compact = false }: Props) {
    const [query, setQuery] = useState(defaultValue);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedQuery = query.trim();
        const nextPath = trimmedQuery
            ? `${routes.events}?q=${encodeURIComponent(trimmedQuery)}`
            : routes.events;

        window.location.href = nextPath;
    };

    return (
        <form
            className={`${styles.search} ${compact ? styles.compact : ""}`}
            role="search"
            onSubmit={handleSubmit}
        >
            <label>
                <span>Buscar eventos</span>
                <input
                    type="search"
                    value={query}
                    placeholder="Busca por evento, ciudad o artista"
                    onChange={(event) => setQuery(event.target.value)}
                />
            </label>

            <button type="submit">Buscar</button>
        </form>
    );
}
