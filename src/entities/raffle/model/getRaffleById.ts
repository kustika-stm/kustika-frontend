import { raffles } from "./mockRaffles";

export function getRaffleById(raffleId: string) {
    return raffles.find((raffle) => raffle.id === raffleId);
}
