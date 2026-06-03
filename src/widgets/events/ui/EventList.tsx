import { useEffect, useRef } from "react";
import { EventCard } from "../../../entities/event/ui/EventCard";
import { usePublicEvents } from "../../../features/events/model";
import styles from "./event-list.module.css";

import Arrow from "../../../shared/assets/icons/arrow.png";

export function EventList() {
    const listRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const { events, isLoading, error } = usePublicEvents();

    useEffect(() => {
        return () => {
            if (animationRef.current !== null) {
                window.cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const scroll = (direction: "left" | "right") => {
        const list = listRef.current;

        if (!list) {
            return;
        }

        if (animationRef.current !== null) {
            window.cancelAnimationFrame(animationRef.current);
        }

        const maxScroll = list.scrollWidth - list.clientWidth;
        const card = list.querySelector<HTMLElement>(`.${styles.item}`);
        const cardWidth = card ? card.offsetWidth : list.clientWidth * 0.8;
        const gap = Number.parseFloat(window.getComputedStyle(list).columnGap) || 0;
        const distance = cardWidth + gap;
        const start = list.scrollLeft;
        const target = Math.min(
            Math.max(start + (direction === "left" ? -distance : distance), 0),
            maxScroll,
        );
        const duration = 420;
        const startedAt = performance.now();

        list.classList.add(styles.isAnimating);

        const animate = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            list.scrollLeft = start + ((target - start) * eased);

            if (progress < 1) {
                animationRef.current = window.requestAnimationFrame(animate);
                return;
            }

            list.scrollLeft = target;
            list.classList.remove(styles.isAnimating);
            animationRef.current = null;
        };

        animationRef.current = window.requestAnimationFrame(animate);
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
                    {isLoading && <p>Cargando eventos...</p>}
                    {!isLoading && error && <p>{error}</p>}
                    {!isLoading && !error && events.length === 0 && <p>Aún no hay eventos publicados.</p>}
                    {!isLoading && !error && events.map((event) => (
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
