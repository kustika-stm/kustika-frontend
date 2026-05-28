export type RaffleStatus = "trending" | "limited" | "hot" | "rare";

export type Raffle = {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    price: string;
    entries: string;
    endsIn: string;
    status: RaffleStatus;
    image: string;
    featured?: boolean;
};
