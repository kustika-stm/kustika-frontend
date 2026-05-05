import styles from "./home.module.css";
import { Hero } from "../../widgets/hero/ui/hero";
import { EventList } from "../../widgets/events/ui/EventList";

export const HomePage = () => {
    return (
        <main className={styles.main}>
            <Hero />
            <EventList />
        </main>
    );
};