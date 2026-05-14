// app/router/routes.ts

export const routes = {
    home: "/",
    app: "/app",
    events: "/eventos",
    categories: "/categorias",
    myTickets: "/mis-boletos",
    profile: "/perfil",
    editProfile: "/perfil/editar",
    categoryDetailBase: "/categorias",
    categoryDetail: (categoryId: string) => `/categorias/${categoryId}`,
    login: "/login",
    register: "/registro",
    eventDetailBase: "/eventos",
    eventDetail: (eventId: string) => `/eventos/${eventId}`,
    eventCheckout: (eventId: string) => `/eventos/${eventId}/comprar`,
} as const;
