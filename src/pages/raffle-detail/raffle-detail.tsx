import { useEffect, useMemo, useState } from "react";
import { routes } from "../../app/router/routes";
import { type Raffle, type RaffleStatus } from "../../entities/raffle";
import { rafflesApi } from "../../features/raffles";
import styles from "./raffle-detail.module.css";

const badgeLabels: Record<RaffleStatus, string> = {
    trending: "Destacada",
    limited: "Limitada",
    hot: "Popular",
    rare: "Especial",
};

const ticketOptions = [
    { amount: 1, label: "01", subtitle: "boleto" },
    { amount: 5, label: "05", subtitle: "boletos", popular: true },
];

type RaffleDetailPageProps = {
    raffleId: string;
};

function formatMoney(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(value);
}

function RaffleBadge({ status }: { status: RaffleStatus }) {
    return <span className={`${styles.badge} ${styles[status]}`}>{badgeLabels[status]}</span>;
}

function MiniRaffleCard({ raffle }: { raffle: Raffle }) {
    return (
        <a className={styles.miniCard} href={routes.raffleDetail(raffle.id)}>
            <img src={raffle.image} alt="" aria-hidden="true" />
            <span>{raffle.price}</span>
            <strong>{raffle.title}</strong>
        </a>
    );
}

export function RaffleDetailPage({ raffleId }: RaffleDetailPageProps) {
    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [ticketCount, setTicketCount] = useState(5);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            rafflesApi.getPublicRaffle(raffleId),
            rafflesApi.getPublicRaffles().catch(() => [] as Raffle[]),
        ])
            .then(([nextRaffle, nextRaffles]) => {
                if (isMounted) {
                    setRaffle(nextRaffle);
                    setRaffles(nextRaffles);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (isMounted) {
                    setError(requestError instanceof Error ? requestError.message : "Sorteo no encontrado");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [raffleId]);

    const relatedRaffles = useMemo(() => {
        return raffles.filter((item) => item.id !== raffleId).slice(0, 3);
    }, [raffleId, raffles]);

    if (isLoading) {
        return (
            <main className={styles.page}>
                <section className={styles.notFound}>
                    <h1>Cargando sorteo</h1>
                    <p>Estamos consultando los detalles del sorteo.</p>
                </section>
            </main>
        );
    }

    if (error || !raffle) {
        return (
            <main className={styles.page}>
                <section className={styles.notFound}>
                    <h1>Sorteo no encontrado</h1>
                    <p>{error || "Ese sorteo ya no está disponible o cambió de dirección."}</p>
                    <a href={routes.raffles}>Volver a sorteos</a>
                </section>
            </main>
        );
    }

    const subtotal = raffle.ticketPrice * ticketCount;

    return (
        <main className={styles.page}>
            <section className={styles.detailShell} aria-labelledby="raffle-detail-title">
                <header className={styles.topBar}>
                    <a href={routes.raffles} aria-label="Volver a sorteos">‹</a>
                    <strong>Detalle del sorteo</strong>
                    <button type="button" aria-label="Compartir sorteo">⌯</button>
                </header>

                <div className={styles.detailContent}>
                    <div className={styles.heroImage}>
                        <img src={raffle.image} alt={raffle.title} />
                        <span className={styles.countdown}>◉ {raffle.endsIn}</span>
                        <span className={styles.pricePill}>{raffle.price} / boleto</span>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.metaLine}>
                            <RaffleBadge status={raffle.status} />
                            <span>{raffle.ticketsSold} boletos vendidos</span>
                        </div>

                        <h1 id="raffle-detail-title">{raffle.title}</h1>
                        <p>{raffle.description}</p>

                        <section className={styles.ticketSection} aria-labelledby="choose-tickets-title">
                            <h2 id="choose-tickets-title">Elige tus boletos</h2>
                            <div className={styles.ticketOptions}>
                                {ticketOptions.map((option) => (
                                    <button
                                        className={ticketCount === option.amount ? styles.ticketOptionActive : styles.ticketOption}
                                        type="button"
                                        onClick={() => setTicketCount(option.amount)}
                                        key={option.amount}
                                    >
                                        {option.popular && <span>Más popular</span>}
                                        <strong>{option.label}</strong>
                                        <small>{option.subtitle}</small>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.customAmount}>
                                <div>
                                    <strong>Cantidad personalizada</strong>
                                    <span>Máximo 50 boletos por persona</span>
                                </div>
                                <div className={styles.stepper}>
                                    <button
                                        type="button"
                                        aria-label="Quitar boleto"
                                        disabled={ticketCount <= 1}
                                        onClick={() => setTicketCount((value) => Math.max(1, value - 1))}
                                    >
                                        -
                                    </button>
                                    <span>{String(ticketCount).padStart(2, "0")}</span>
                                    <button
                                        type="button"
                                        aria-label="Agregar boleto"
                                        disabled={ticketCount >= 50}
                                        onClick={() => setTicketCount((value) => Math.min(50, value + 1))}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </section>

                        <div className={styles.trustRow}>
                            <span>● Sorteo verificado</span>
                            <span>● Transacción segura</span>
                        </div>

                        <div className={styles.checkoutBar}>
                            <div>
                                <span>Total</span>
                                <strong>{formatMoney(subtotal)}</strong>
                            </div>
                            <a href={routes.raffles}>Participar ahora</a>
                        </div>
                    </div>
                </div>
            </section>

            {relatedRaffles.length > 0 && (
                <section className={styles.relatedPanel} aria-labelledby="related-raffles-title">
                    <div className={styles.relatedHeader}>
                        <h2 id="related-raffles-title">Más sorteos activos</h2>
                        <a href={routes.raffles}>Ver todo</a>
                    </div>
                    <div className={styles.relatedGrid}>
                        {relatedRaffles.map((item) => (
                            <MiniRaffleCard raffle={item} key={item.id} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
