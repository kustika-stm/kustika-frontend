import { useEffect, useRef, useState } from "react";
import { routes } from "../../app/router/routes";
import { getStoredSession } from "../../entities/session";
import { EventImage } from "../../entities/event/ui/EventImage";
import { usePublicEvent } from "../../features/events/model";
import { isProfileComplete } from "../../features/profile/model";
import styles from "./event-detail.module.css";

type Props = {
    eventId: string;
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(price);
};

export function EventDetailPage({ eventId }: Props) {
    const { event, isLoading, error } = usePublicEvent(eventId);
    const buyBoxTriggerRef = useRef<HTMLDivElement>(null);
    const [isBuyBoxCompact, setIsBuyBoxCompact] = useState(false);

    const handleBuyTickets = () => {
        const session = getStoredSession();

        if (!session?.accessToken) {
            window.location.href = routes.login;
            return;
        }

        if (!isProfileComplete(session.user)) {
            window.location.href = `${routes.profile}?complete=1`;
            return;
        }

        window.location.href = routes.eventCheckout(eventId);
    };

    useEffect(() => {
        const updateBuyBoxState = () => {
            const trigger = buyBoxTriggerRef.current;

            if (!trigger || window.innerWidth <= 900) {
                setIsBuyBoxCompact(false);
                return;
            }

            setIsBuyBoxCompact(trigger.getBoundingClientRect().top <= 84);
        };

        updateBuyBoxState();
        window.addEventListener("scroll", updateBuyBoxState, { passive: true });
        window.addEventListener("resize", updateBuyBoxState);

        return () => {
            window.removeEventListener("scroll", updateBuyBoxState);
            window.removeEventListener("resize", updateBuyBoxState);
        };
    }, [eventId]);

    if (isLoading) {
        return (
            <main className={styles.notFound}>
                <span>Cargando evento</span>
                <h1>Estamos consultando los detalles.</h1>
                <p>Un momento, estamos trayendo la información actualizada del evento.</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.notFound}>
                <span>No pudimos cargar el evento</span>
                <h1>Inténtalo de nuevo en unos minutos.</h1>
                <p>{error}</p>
                <a href={routes.events}>Volver a eventos</a>
            </main>
        );
    }

    if (!event) {
        return (
            <main className={styles.notFound}>
                <span>Evento no encontrado</span>
                <h1>No encontramos este evento.</h1>
                <p>Puede que el enlace haya cambiado o que el evento ya no esté disponible.</p>
                <a href={routes.home}>Volver a eventos</a>
            </main>
        );
    }

    const availableTickets = event.ticketTiers.filter((ticket) => ticket.available);
    const primaryTicket = availableTickets[0] ?? event.ticketTiers[0];
    const canBuyTickets = event.status !== "sold-out" && availableTickets.length > 0;
    const renderBuyBoxContent = (isInteractive: boolean) => (
        <>
            <div className={styles.buyIntro}>
                <span className={styles.eyebrow}>Desde</span>
                <strong className={styles.price}>{formatPrice(event.price)}</strong>
                <p>{primaryTicket.description}</p>
            </div>

            <div className={styles.eventFacts} aria-label="Fecha, hora y ubicación del evento">
                <div>
                    <span>Fecha</span>
                    <strong>{event.date}</strong>
                </div>
                <div>
                    <span>Hora</span>
                    <strong>{event.time}</strong>
                </div>
                <div>
                    <span>Lugar</span>
                    <strong>{event.venueName}</strong>
                    <p>{event.address}</p>
                    <p>{event.city}</p>
                </div>
            </div>

            <div className={styles.buyAction}>
                <button
                    type="button"
                    className={styles.cta}
                    disabled={!canBuyTickets}
                    tabIndex={isInteractive ? 0 : -1}
                    onClick={handleBuyTickets}
                >
                    {canBuyTickets ? "Comprar boletos" : "Agotado"}
                </button>
            </div>
        </>
    );

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <EventImage src={event.image} alt={event.title} className={styles.heroImage} />
                <div className={styles.heroOverlay} />

                <div className={styles.heroContent}>
                    <div className={styles.heroInfo}>
                        <a href={routes.home} className={styles.backLink}>Volver</a>

                        <div className={styles.titleGroup}>
                            <span className={styles.kicker}>{event.category}</span>
                            <h1>{event.title}</h1>
                            <p>{event.subtitle}</p>
                        </div>

                    <div className={styles.heroMeta} aria-label="Información principal del evento">
                        <div>
                            <span>Fecha</span>
                            <strong>{event.date}</strong>
                        </div>
                        <div>
                            <span>Hora</span>
                            <strong>{event.time}</strong>
                        </div>
                        <div>
                            <span>Ciudad</span>
                            <strong>{event.location}</strong>
                        </div>
                    </div>

                    </div>

                    <EventImage src={event.image} alt={event.title} className={styles.heroPoster} />
                </div>
            </section>

            <section className={styles.content}>
                <aside className={styles.sidebar}>
                    <div ref={buyBoxTriggerRef} className={styles.buyBoxTrigger} />

                    <section
                        className={`${styles.buyBox} ${styles.buyBoxDocked} ${isBuyBoxCompact ? styles.buyBoxDockedHidden : ""}`}
                        aria-hidden={isBuyBoxCompact}
                    >
                        {renderBuyBoxContent(!isBuyBoxCompact)}
                    </section>

                    <section
                        className={`${styles.buyBox} ${styles.buyBoxFloating} ${isBuyBoxCompact ? styles.buyBoxFloatingVisible : ""}`}
                        aria-hidden={!isBuyBoxCompact}
                    >
                        {renderBuyBoxContent(isBuyBoxCompact)}
                    </section>

                    <section className={styles.sideBlock}>
                        <h2>Boletos</h2>
                        <div className={styles.tickets}>
                            {event.ticketTiers.map((ticket) => (
                                <div key={ticket.id} className={styles.ticket}>
                                    <div>
                                        <strong>{ticket.name}</strong>
                                        <p>{ticket.description}</p>
                                    </div>
                                    <span>{ticket.available ? formatPrice(ticket.price) : "Agotado"}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.sideBlock}>
                        <h2>Resumen</h2>
                        <div className={styles.summary}>
                            <div>
                                <span className={styles.eyebrow}>Organiza</span>
                                <strong>{event.organizer}</strong>
                            </div>
                            <div>
                                <span className={styles.eyebrow}>Cupo</span>
                                <strong>{event.capacity} personas</strong>
                            </div>
                            <div>
                                <span className={styles.eyebrow}>Estado</span>
                                <strong>{event.status === "available" ? "Disponible" : event.status === "soon" ? "Próximamente" : "Agotado"}</strong>
                            </div>
                        </div>
                    </section>

                    <section className={styles.sideBlock}>
                        <h2>Importante</h2>
                        <ul className={styles.policies}>
                            {event.policies.map((policy) => (
                                <li key={policy}>{policy}</li>
                            ))}
                        </ul>
                    </section>

                    <div className={styles.tags}>
                        {event.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                </aside>

                <article className={styles.mainInfo}>
                    <section className={styles.block}>
                        <h2>Sobre el evento</h2>
                        <p>{event.description}</p>
                    </section>

                    <section className={styles.block}>
                        <h2>Lo que incluye</h2>
                        <div className={styles.highlights}>
                            {event.highlights.map((highlight) => (
                                <div key={highlight} className={styles.highlight}>
                                    <span />
                                    <p>{highlight}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.block}>
                        <h2>Agenda</h2>
                        <div className={styles.timeline}>
                            {event.schedule.map((item) => (
                                <div key={`${item.time}-${item.label}`} className={styles.timelineItem}>
                                    <time>{item.time}</time>
                                    <div>
                                        <strong>{item.label}</strong>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </article>
            </section>
        </main>
    );
}
