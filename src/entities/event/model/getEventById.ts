import { mockEvents } from "./mockEvents";

export function getEventById(eventId: string) {
    return mockEvents.find((event) => event.id === eventId || event.slug === eventId);
}
