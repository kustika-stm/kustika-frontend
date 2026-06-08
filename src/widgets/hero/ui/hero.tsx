import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { routes } from "../../../app/router/routes";
import type { Event } from "../../../entities/event/model/event";
import type { Raffle } from "../../../entities/raffle";
import { usePublicEvents } from "../../../features/events/model";
import { rafflesApi } from "../../../features/raffles";
import fallbackImage from "../../../shared/assets/images/hero/hero.jpg";
import styles from "./hero.module.css";

type HeroSlide = {
    id: string;
    badge: string;
    title: string;
    description: string;
    meta: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    image: string;
};

const fallbackSlide: HeroSlide = {
    id: "discover-kustika",
    badge: "Descubre Kustika",
    title: "Encuentra tu siguiente experiencia",
    description: "Eventos y sorteos seleccionados para vivir algo diferente.",
    meta: "Explora lo nuevo en Kustika",
    primaryLabel: "Explorar eventos",
    primaryHref: routes.events,
    secondaryLabel: "Ver sorteos",
    secondaryHref: routes.raffles,
    image: fallbackImage,
};

const eventToSlide = (event: Event): HeroSlide => ({
    id: `event-${event.id}`,
    badge: `${event.category} destacado`,
    title: event.title,
    description: event.subtitle || event.description,
    meta: `${event.date} · ${event.time} · ${event.location}`,
    primaryLabel: "Ver evento",
    primaryHref: routes.eventDetail(event.id),
    secondaryLabel: "Todos los eventos",
    secondaryHref: routes.events,
    image: event.image || fallbackImage,
});

const raffleToSlide = (raffle: Raffle): HeroSlide => ({
    id: `raffle-${raffle.id}`,
    badge: "Sorteo destacado",
    title: raffle.title,
    description: raffle.description || raffle.subtitle,
    meta: `${raffle.entries} · Entrada ${raffle.price}`,
    primaryLabel: "Entrar al sorteo",
    primaryHref: routes.raffleDetail(raffle.id),
    secondaryLabel: "Todos los sorteos",
    secondaryHref: routes.raffles,
    image: raffle.image || fallbackImage,
});

export function Hero() {
    const { events } = usePublicEvents();
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;

        rafflesApi.getPublicRaffles()
            .then((response) => {
                if (isMounted) {
                    setRaffles(response);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setRaffles([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const slides = useMemo(() => {
        const availableEvents = events.filter((event) => event.status !== "sold-out");
        const featuredEvents = availableEvents.filter((event) => event.featured);
        const selectedEvents = (featuredEvents.length ? featuredEvents : availableEvents).slice(0, 2);
        const featuredRaffle = raffles.find((raffle) => raffle.featured) ?? raffles[0];
        const contentSlides = [
            ...selectedEvents.map(eventToSlide),
            ...(featuredRaffle ? [raffleToSlide(featuredRaffle)] : []),
        ];

        return contentSlides.length ? contentSlides : [fallbackSlide];
    }, [events, raffles]);

    const showSlide = (index: number) => {
        setActiveSlide((index + slides.length) % slides.length);
    };

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (isPaused || prefersReducedMotion || slides.length < 2) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setActiveSlide((currentSlide) => (currentSlide + 1) % slides.length);
        }, 6500);

        return () => window.clearInterval(intervalId);
    }, [isPaused, slides.length]);

    const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
        if (touchStartX.current === null || slides.length < 2) {
            return;
        }

        const distance = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(distance) >= 50) {
            showSlide((activeSlide % slides.length) + (distance < 0 ? 1 : -1));
        }
    };

    const visibleSlideIndex = activeSlide % slides.length;
    const currentSlide = slides[visibleSlideIndex];

    return (
        <section
            className={styles.wrapper}
            aria-roledescription="carrusel"
            aria-label="Eventos y sorteos destacados"
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            onTouchStart={(event) => {
                touchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={handleTouchEnd}
        >
            <div className={styles.banner}>
                {slides.map((slide, index) => (
                    <div
                        aria-hidden={index !== visibleSlideIndex}
                        className={`${styles.slide} ${index === visibleSlideIndex ? styles.activeSlide : ""}`}
                        key={slide.id}
                        style={{ backgroundImage: `url(${slide.image})` }}
                    />
                ))}

                <div className={styles.overlay} />

                <div className={styles.content} aria-live="polite" aria-atomic="true">
                    <span className={styles.badge}>{currentSlide.badge}</span>
                    <h1>{currentSlide.title}</h1>
                    <p>{currentSlide.description}</p>
                    <span className={styles.meta}>{currentSlide.meta}</span>

                    <div className={styles.actions}>
                        <a className={styles.primary} href={currentSlide.primaryHref}>
                            {currentSlide.primaryLabel}
                        </a>
                        <a className={styles.secondary} href={currentSlide.secondaryHref}>
                            {currentSlide.secondaryLabel}
                        </a>
                    </div>
                </div>

                {slides.length > 1 && (
                    <div className={styles.controls}>
                        <button
                            type="button"
                            className={styles.arrow}
                            aria-label="Mostrar destacado anterior"
                            onClick={() => showSlide(visibleSlideIndex - 1)}
                        >
                            <span aria-hidden="true">‹</span>
                        </button>

                        <div className={styles.dots} aria-label="Elegir destacado">
                            {slides.map((slide, index) => (
                                <button
                                    type="button"
                                    className={`${styles.dot} ${index === visibleSlideIndex ? styles.activeDot : ""}`}
                                    aria-label={`Mostrar ${slide.title}`}
                                    aria-current={index === visibleSlideIndex ? "true" : undefined}
                                    key={slide.id}
                                    onClick={() => showSlide(index)}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            className={styles.arrow}
                            aria-label="Mostrar siguiente destacado"
                            onClick={() => showSlide(visibleSlideIndex + 1)}
                        >
                            <span aria-hidden="true">›</span>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
