import { mockEvents } from "./mockEvents";

export type TicketStatus = "active" | "used" | "refunded";

export type MockTicket = {
    id: string;
    eventSlug: string;
    ticketType: string;
    holderName: string;
    orderId: string;
    seatLabel: string;
    purchaseDate: string;
    status: TicketStatus;
    accessCode: string;
};

const getEventSlug = (index: number) => mockEvents[index]?.slug ?? mockEvents[0].slug;

export const mockTickets: MockTicket[] = [
    {
        id: "EVX-NEON-0421",
        eventSlug: getEventSlug(0),
        ticketType: "VIP",
        holderName: "Alex Rivera",
        orderId: "ORD-84329",
        seatLabel: "Zona VIP - Acceso 2",
        purchaseDate: "12 Sep 2026",
        status: "active",
        accessCode: "NEON-7K4P-21",
    },
    {
        id: "EVX-MID-1180",
        eventSlug: getEventSlug(1),
        ticketType: "Tour completo",
        holderName: "Alex Rivera",
        orderId: "ORD-85110",
        seatLabel: "Grupo B - Unidad 04",
        purchaseDate: "02 Oct 2026",
        status: "active",
        accessCode: "CITY-2M8Q-80",
    },
    {
        id: "EVX-RISAS-0209",
        eventSlug: getEventSlug(4),
        ticketType: "Mesa preferente",
        holderName: "Alex Rivera",
        orderId: "ORD-77904",
        seatLabel: "Mesa 6 - Lugar 2",
        purchaseDate: "18 Ago 2026",
        status: "used",
        accessCode: "ROMA-9C2D-09",
    },
];
