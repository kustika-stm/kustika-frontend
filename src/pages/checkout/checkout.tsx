import { useState } from "react";
import { routes } from "../../app/router/routes";
import { getEventById } from "../../entities/event/model/getEventById";
import { getStoredSession } from "../../entities/session";
import { getMissingProfileFields, isProfileComplete } from "../../features/profile/model";
import styles from "./checkout.module.css";

type Props = {
    eventId: string;
};

const mexicoStates = [
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Chiapas",
    "Chihuahua",
    "Ciudad de Mexico",
    "Coahuila",
    "Colima",
    "Durango",
    "Estado de Mexico",
    "Guanajuato",
    "Guerrero",
    "Hidalgo",
    "Jalisco",
    "Michoacan",
    "Morelos",
    "Nayarit",
    "Nuevo Leon",
    "Oaxaca",
    "Puebla",
    "Queretaro",
    "Quintana Roo",
    "San Luis Potosi",
    "Sinaloa",
    "Sonora",
    "Tabasco",
    "Tamaulipas",
    "Tlaxcala",
    "Veracruz",
    "Yucatan",
    "Zacatecas",
];

const paymentMethods = [
    { id: "card", label: "Tarjeta", hint: "Credito o debito" },
    { id: "transfer", label: "Transferencia", hint: "Referencia bancaria" },
    { id: "cash", label: "Efectivo", hint: "Pago en tienda aliada" },
];

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(price);
};

export function CheckoutPage({ eventId }: Props) {
    const event = getEventById(eventId);
    const session = getStoredSession();
    const [selectedTicketId, setSelectedTicketId] = useState("");
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("card");

    if (!event) {
        return (
            <main className={styles.notFound}>
                <span>Checkout</span>
                <h1>No encontramos este evento.</h1>
                <p>Puede que el enlace haya cambiado o que el evento ya no este disponible.</p>
                <a href={routes.home}>Volver a eventos</a>
            </main>
        );
    }

    if (!session?.accessToken) {
        return (
            <main className={styles.notFound}>
                <span>Compra segura</span>
                <h1>Inicia sesion para comprar.</h1>
                <p>Necesitamos validar tu cuenta antes de generar tus boletos.</p>
                <a href={routes.login}>Iniciar sesion</a>
            </main>
        );
    }

    if (!isProfileComplete(session.user)) {
        const missingFields = getMissingProfileFields(session.user).map((field) => field.label).join(", ");

        return (
            <main className={styles.page}>
                <section className={styles.profileGate}>
                    <span className={styles.eyebrow}>Completa tus datos</span>
                    <h1>Antes de comprar necesitamos tu perfil completo.</h1>
                    <p>Te falta agregar: {missingFields}. Cuando termines, podras continuar con tu compra.</p>
                    <a href={`${routes.profile}?complete=1`}>Completar perfil</a>
                </section>
            </main>
        );
    }

    const availableTickets = event.ticketTiers.filter((ticket) => ticket.available);
    const primaryTicket = availableTickets[0] ?? event.ticketTiers[0];
    const selectedTicket = event.ticketTiers.find((ticket) => ticket.id === selectedTicketId) ?? primaryTicket;
    const subtotal = selectedTicket.price * ticketQuantity;
    const serviceFee = Math.round(subtotal * 0.08);
    const total = subtotal + serviceFee;

    return (
        <main className={styles.page}>
            <section className={styles.header}>
                <a href={routes.eventDetail(eventId)} className={styles.backLink}>Volver al evento</a>

                <div>
                    <span className={styles.eyebrow}>Compra segura</span>
                    <h1>Completa tus boletos</h1>
                    <p>{event.title} - {event.date} - {event.time}</p>
                </div>
            </section>

            <section className={styles.layout}>
                <form className={styles.form}>
                    <section className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>1</span>
                            <h2>Elige tus boletos</h2>
                        </div>

                        <div className={styles.ticketChoices}>
                            {event.ticketTiers.map((ticket) => (
                                <label
                                    className={`${styles.ticketChoice} ${selectedTicket.id === ticket.id ? styles.ticketChoiceSelected : ""} ${!ticket.available ? styles.ticketChoiceDisabled : ""}`}
                                    key={ticket.id}
                                >
                                    <input
                                        type="radio"
                                        name="ticket-tier"
                                        value={ticket.id}
                                        checked={selectedTicket.id === ticket.id}
                                        disabled={!ticket.available}
                                        onChange={() => setSelectedTicketId(ticket.id)}
                                    />

                                    <span>
                                        <strong>{ticket.name}</strong>
                                        <small>{ticket.description}</small>
                                    </span>

                                    <b>{ticket.available ? formatPrice(ticket.price) : "Agotado"}</b>
                                </label>
                            ))}
                        </div>

                        <div className={styles.quantityControl}>
                            <div>
                                <span className={styles.eyebrow}>Cantidad</span>
                                <strong>{ticketQuantity} boleto{ticketQuantity > 1 ? "s" : ""}</strong>
                            </div>

                            <div className={styles.quantityButtons}>
                                <button
                                    type="button"
                                    aria-label="Restar boleto"
                                    disabled={ticketQuantity === 1}
                                    onClick={() => setTicketQuantity((quantity) => Math.max(1, quantity - 1))}
                                >
                                    -
                                </button>
                                <span>{ticketQuantity}</span>
                                <button
                                    type="button"
                                    aria-label="Agregar boleto"
                                    disabled={ticketQuantity === 6}
                                    onClick={() => setTicketQuantity((quantity) => Math.min(6, quantity + 1))}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>2</span>
                            <h2>Datos personales</h2>
                        </div>

                        <p className={styles.stepHint}>
                            Usaremos estos datos para enviar tus accesos y validar la compra.
                        </p>

                        <div className={styles.formGrid}>
                            <label>
                                Nombre
                                <input type="text" name="firstName" placeholder="Ej. Daniela" />
                            </label>
                            <label>
                                Apellido paterno
                                <input type="text" name="lastName" placeholder="Ej. Garcia" />
                            </label>
                            <label>
                                Apellido materno
                                <input type="text" name="secondLastName" placeholder="Ej. Lopez" />
                            </label>
                            <label>
                                Correo
                                <input type="email" name="email" placeholder="correo@ejemplo.com" />
                            </label>
                            <label>
                                Confirmar correo
                                <input type="email" name="emailConfirm" placeholder="Repite tu correo" />
                            </label>
                            <label>
                                Telefono celular
                                <input type="tel" name="phone" placeholder="+52 10 digitos" />
                            </label>
                            <label>
                                Ciudad
                                <input type="text" name="city" placeholder="Ciudad donde resides" />
                            </label>
                            <label>
                                Estado
                                <select name="state" defaultValue="">
                                    <option value="" disabled>Selecciona tu estado</option>
                                    {mexicoStates.map((state) => (
                                        <option value={state.toLowerCase().replaceAll(" ", "-")} key={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={styles.fullField}>
                                Nombre para mostrar en boleto
                                <input type="text" name="ticketName" placeholder="Puede ser tu nombre o el de quien asistira" />
                            </label>
                        </div>
                    </section>

                    <section className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>3</span>
                            <h2>Tipo de pago</h2>
                        </div>

                        <div className={styles.paymentChoices}>
                            {paymentMethods.map((method) => (
                                <label
                                    className={`${styles.paymentChoice} ${paymentMethod === method.id ? styles.paymentChoiceSelected : ""}`}
                                    key={method.id}
                                >
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        value={method.id}
                                        checked={paymentMethod === method.id}
                                        onChange={() => setPaymentMethod(method.id)}
                                    />
                                    <span>
                                        <strong>{method.label}</strong>
                                        <small>{method.hint}</small>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>
                </form>

                <aside className={styles.summary}>
                    <span className={styles.eyebrow}>Resumen</span>
                    <h2>{event.title}</h2>
                    <p>{event.venueName}</p>
                    <p>{event.date} - {event.time}</p>

                    <div className={styles.summaryRows}>
                        <div>
                            <span>{selectedTicket.name} x {ticketQuantity}</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </div>
                        <div>
                            <span>Servicio</span>
                            <strong>{formatPrice(serviceFee)}</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <strong>{formatPrice(total)}</strong>
                        </div>
                    </div>

                    <button type="button" className={styles.checkoutCta}>
                        Confirmar compra
                    </button>
                </aside>
            </section>
        </main>
    );
}
