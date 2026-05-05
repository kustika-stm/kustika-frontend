import { useRef } from "react";
import { mockEvents } from "../../../entities/event/model/mockEvents";
import { EventCard } from "../../../entities/event/ui/EventCard";
import styles from "./event-list.module.css";

import Arrow from "../../../shared/assets/icons/arrow.png";

export function EventList() {
    const listRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!listRef.current) return;

        const scrollAmount = listRef.current.clientWidth * 0.8;

        listRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <section className={styles.section}>
            <h2>En tu ciudad</h2>

            <div className={styles.wrapper}>
                <button
                    className={`${styles.arrow} ${styles.left}`}
                    onClick={() => scroll("left")}
                >
                    <img src={Arrow} alt="Scroll left" />
                </button>

                <div ref={listRef} className={styles.list}>
                    {mockEvents.map((event) => (
                        <div key={event.id} className={styles.item}>
                            <EventCard event={event} />
                        </div>
                    ))}
                </div>

                <button
                    className={`${styles.arrow} ${styles.right}`}
                    onClick={() => scroll("right")}
                >
                    <img src={Arrow} alt="Scroll right" />
                </button>
            </div>
        </section>
    );
}