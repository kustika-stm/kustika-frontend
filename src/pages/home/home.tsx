import styles from "./home.module.css";
import { Hero } from "../../widgets/hero/ui/hero";
import { EventList } from "../../widgets/events/ui/EventList";
import { DiscoverGrid } from "../../widgets/discover/ui/DiscoverGrid";

export const HomePage = () => {
    return (
        <main className={styles.main}>
            <Hero />
            <DiscoverGrid />
            <EventList />
        </main>
    );
};