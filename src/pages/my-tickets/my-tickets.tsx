import { routes } from "../../app/router/routes";
import { getEventById } from "../../entities/event/model/getEventById";
import { mockTickets, type TicketStatus } from "../../entities/event/model/mockTickets";
import styles from "./my-tickets.module.css";

const statusLabels: Record<TicketStatus, string> = {
    active: "Activo",
    used: "Usado",
    refunded: "Reembolsado",
};

const upcomingTickets = mockTickets.filter((ticket) => ticket.status === "active");
const pastTickets = mockTickets.filter((ticket) => ticket.status !== "active");

function TicketCard({ ticket }: { ticket: (typeof mockTickets)[number] }) {
    const event = getEventById(ticket.eventSlug);

    if (!event) {
        return null;
    }

    return (
        <article className={styles.ticketCard}>
            <div className={styles.eventMedia}>
                <img src={event.image} alt={event.title} />
                <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                </span>
            </div>

            <div className={styles.ticketBody}>
                <div className={styles.ticketHeader}>
                    <div>
                        <span className={styles.eyebrow}>{ticket.ticketType}</span>
                        <h3>{event.title}</h3>
                    </div>
                    <strong>{ticket.id}</strong>
                </div>

                <dl className={styles.ticketDetails}>
                    <div>
                        <dt>Fecha</dt>
                        <dd>{event.date} - {event.time}</dd>
                    </div>
                    <div>
                        <dt>Lugar</dt>
                        <dd>{event.venueName}</dd>
                    </div>
                    <div>
                        <dt>Titular</dt>
                        <dd>{ticket.holderName}</dd>
                    </div>
                    <div>
                        <dt>Acceso</dt>
                        <dd>{ticket.seatLabel}</dd>
                    </div>
                </dl>

                <div className={styles.actions}>
                    <a href={routes.eventDetail(event.slug)}>Ver evento</a>
                    <button type="button">Descargar e-ticket</button>
                </div>
            </div>

            <aside className={styles.ticketCode} aria-label={`Codigo de acceso ${ticket.accessCode}`}>
                <div className={styles.qrMark}>
                    {ticket.accessCode.split("").slice(0, 9).map((char, index) => (
                        <span key={`${char}-${index}`} />
                    ))}
                </div>
                <span>{ticket.accessCode}</span>
                <small>Orden {ticket.orderId}</small>
            </aside>
        </article>
    );
}

export function MyTicketsPage() {
    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span className={styles.eyebrow}>Mis boletos</span>
                    <h1>Tus e-tickets en un solo lugar</h1>
                    <p>
                        Consulta tus accesos digitales, revisa el código de entrada y vuelve al detalle del evento cuando lo necesites.
                    </p>
                </div>

                <div className={styles.summary}>
                    <strong>{upcomingTickets.length}</strong>
                    <span>boletos activos</span>
                </div>
            </section>

            <section className={styles.section} aria-labelledby="active-tickets-title">
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 id="active-tickets-title">Proximos accesos</h2>
                        <p>Ten listo tu boleto digital para entrar más rápido al recinto.</p>
                    </div>
                </div>

                <div className={styles.ticketList}>
                    {upcomingTickets.map((ticket) => (
                        <TicketCard ticket={ticket} key={ticket.id} />
                    ))}
                </div>
            </section>

            <section className={styles.section} aria-labelledby="past-tickets-title">
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 id="past-tickets-title">Historial</h2>
                        <p>Boletos usados o compras que ya no están activas.</p>
                    </div>
                </div>

                <div className={styles.ticketList}>
                    {pastTickets.map((ticket) => (
                        <TicketCard ticket={ticket} key={ticket.id} />
                    ))}
                </div>
            </section>
        </main>
    );
}
