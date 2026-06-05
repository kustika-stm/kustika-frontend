import styles from "./home.module.css";
import { Hero } from "../../widgets/hero/ui/hero";
import { EventList } from "../../widgets/events/ui/EventList";
import { DiscoverGrid } from "../../widgets/discover/ui/DiscoverGrid";
import { EventSearchBar } from "../../features/event-search";

export const HomePage = () => {
    return (
        <main className={styles.main}>
            <Hero />
            <section className={styles.searchSection} aria-label="Buscar eventos">
                <EventSearchBar />
            </section>
            <EventList />
            <DiscoverGrid />
        </main>
    );
};
