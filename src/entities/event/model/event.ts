export type Event = {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    location: string;
    venueName: string;
    address: string;
    city: string;
    date: string;
    time: string;
    price: number;
    image: string;
    category: string;
    status: "available" | "sold-out" | "soon";
    featured?: boolean;
    organizer: string;
    capacity: number;
    tags: string[];
    highlights: string[];
    schedule: EventScheduleItem[];
    ticketTiers: EventTicketTier[];
    policies: string[];
};

export type EventScheduleItem = {
    time: string;
    label: string;
    description: string;
};

export type EventTicketTier = {
    id: string;
    name: string;
    price: number;
    description: string;
    available: boolean;
};
