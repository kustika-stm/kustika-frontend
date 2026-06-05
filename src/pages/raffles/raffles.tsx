import { useEffect, useState } from "react";
import { routes } from "../../app/router/routes";
import { type Raffle, type RaffleStatus } from "../../entities/raffle";
import { rafflesApi } from "../../features/raffles";
import styles from "./raffles.module.css";

const badgeLabels: Record<RaffleStatus, string> = {
    trending: "En tendencia",
    limited: "Limitada",
    hot: "Popular",
    rare: "Especial",
};

function RaffleBadge({ status }: { status: RaffleStatus }) {
    return <span className={`${styles.badge} ${styles[status]}`}>{badgeLabels[status]}</span>;
}

function Timer({ value }: { value: string }) {
    return (
        <span className={styles.timer} aria-label={`Termina en ${value}`}>
            <span aria-hidden="true">◉</span>
            {value}
        </span>
    );
}

function FeaturedRaffle({ raffle }: { raffle: Raffle }) {
    return (
        <article className={styles.featuredCard}>
            <img src={raffle.image} alt="" aria-hidden="true" />
            <div className={styles.featuredShade} />
            <div className={styles.featuredContent}>
                <div className={styles.featuredMeta}>
                    <RaffleBadge status={raffle.status} />
                    <span>{raffle.entries}</span>
                </div>
                <h2>{raffle.title}</h2>
                <p>{raffle.description}</p>
                <Timer value={raffle.endsIn} />
                <a className={styles.featuredCta} href={routes.raffleDetail(raffle.id)}>
                    Entrar por {raffle.price}
                </a>
            </div>
        </article>
    );
}

function RaffleCard({ raffle }: { raffle: Raffle }) {
    return (
        <article className={styles.raffleCard} id={raffle.id}>
            <div className={styles.imageWrap}>
                <img src={raffle.image} alt={raffle.title} />
                <RaffleBadge status={raffle.status} />
                <Timer value={raffle.endsIn} />
            </div>
            <div className={styles.cardBody}>
                <h3>{raffle.title}</h3>
                <p>{raffle.subtitle}</p>
                <div className={styles.cardFooter}>
                    <div>
                        <span>Precio</span>
                        <strong>{raffle.price}</strong>
                    </div>
                    <a href={routes.raffleDetail(raffle.id)}>Entrar ahora</a>
                </div>
            </div>
        </article>
    );
}

export function RafflesPage() {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        rafflesApi.getPublicRaffles()
            .then((response) => {
                if (isMounted) {
                    setRaffles(response);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (isMounted) {
                    setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los sorteos.");
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
    }, []);

    const featuredRaffle = raffles.find((raffle) => raffle.featured) ?? raffles[0];
    const activeRaffles = featuredRaffle ? raffles.filter((raffle) => raffle.id !== featuredRaffle.id) : raffles;

    return (
        <main className={styles.page}>
            <section className={styles.hero} aria-labelledby="raffles-title">
                <div>
                    <span>Sorteos Kustika</span>
                    <h1 id="raffles-title">Sorteos para ganar experiencias únicas.</h1>
                    <p>
                        Compra tu entrada, participa en sorteos activos y sigue el contador antes de que cierre cada sorteo.
                    </p>
                </div>
            </section>

            {isLoading ? (
                <section className={styles.statePanel}>
                    <h2>Cargando sorteos</h2>
                    <p>Estamos consultando los sorteos disponibles.</p>
                </section>
            ) : error ? (
                <section className={styles.statePanel}>
                    <h2>No pudimos cargar los sorteos</h2>
                    <p>{error}</p>
                </section>
            ) : !featuredRaffle ? (
                <section className={styles.statePanel}>
                    <h2>No hay sorteos activos</h2>
                    <p>Vuelve pronto para ver nuevas oportunidades de ganar experiencias.</p>
                </section>
            ) : (
                <>
                    <section className={styles.featuredSection} aria-labelledby="featured-raffle-title">
                        <h2 id="featured-raffle-title"><span aria-hidden="true">★</span> Sorteo destacado</h2>
                        <FeaturedRaffle raffle={featuredRaffle} />
                    </section>

                    <section className={styles.activeSection} aria-labelledby="active-raffles-title">
                        <h2 id="active-raffles-title">Sorteos activos</h2>
                        <div className={styles.raffleGrid}>
                            {activeRaffles.map((raffle) => (
                                <RaffleCard raffle={raffle} key={raffle.id} />
                            ))}
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}
