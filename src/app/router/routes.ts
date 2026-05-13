// app/router/routes.ts

export const routes = {
    home: "/",
    app: "/app",
    login: "/login",
    register: "/registro",
    eventDetailBase: "/eventos",
    eventDetail: (eventId: string) => `/eventos/${eventId}`,
    eventCheckout: (eventId: string) => `/eventos/${eventId}/comprar`,
} as const;
