import { apiRequest } from "../../../shared/api";
import type { Raffle, RaffleStatus } from "../../../entities/raffle";

type RaffleResponse = {
    data: Raffle;
};

type RafflesResponse = {
    data: Raffle[];
};

type UploadImageResponse = {
    data?: {
        url?: string;
    };
    url?: string;
};

export type CreateRafflePayload = {
    title: string;
    subtitle: string;
    description: string;
    ticketPrice: number;
    entries: string;
    endsIn: string;
    status: RaffleStatus;
    image: string;
    featured: boolean;
};

export type UpdateRafflePayload = Partial<CreateRafflePayload>;

const editableRaffleFields = [
    "title",
    "subtitle",
    "description",
    "ticketPrice",
    "entries",
    "endsIn",
    "status",
    "image",
    "featured",
] as const;

const sanitizeRafflePayload = (payload: Partial<Record<string, unknown>>): UpdateRafflePayload => {
    return editableRaffleFields.reduce<UpdateRafflePayload>((nextPayload, field) => {
        const value = payload[field];

        if (value !== undefined) {
            return {
                ...nextPayload,
                [field]: value,
            };
        }

        return nextPayload;
    }, {});
};

const getUploadedImageUrl = (response: UploadImageResponse) => {
    return response.data?.url ?? response.url ?? "";
};

const normalizeImageUrl = (imageUrl: string) => {
    return imageUrl
        .replace(/&amp;/g, "&")
        .replace(/&#38;/g, "&");
};

const normalizeRaffle = (raffle: Raffle): Raffle => ({
    ...raffle,
    image: normalizeImageUrl(raffle.image),
});

export const rafflesApi = {
    async getPublicRaffles() {
        const response = await apiRequest<RafflesResponse>("/sorteos");

        return response.data.map(normalizeRaffle);
    },

    async getPublicRaffle(raffleId: string) {
        const response = await apiRequest<RaffleResponse>(`/sorteos/${encodeURIComponent(raffleId)}`);

        return normalizeRaffle(response.data);
    },

    async getAdminRaffles(token: string) {
        const response = await apiRequest<RafflesResponse>("/admin/sorteos", {
            method: "GET",
            token,
        });

        return response.data.map(normalizeRaffle);
    },

    async createAdminRaffle(token: string, payload: CreateRafflePayload) {
        const response = await apiRequest<RaffleResponse>("/admin/sorteos", {
            method: "POST",
            token,
            body: sanitizeRafflePayload(payload),
        });

        return normalizeRaffle(response.data);
    },

    async updateAdminRaffle(token: string, raffleId: string, payload: Partial<Record<string, unknown>>) {
        const response = await apiRequest<RaffleResponse>(`/admin/sorteos/${encodeURIComponent(raffleId)}`, {
            method: "PUT",
            token,
            body: sanitizeRafflePayload(payload),
        });

        return normalizeRaffle(response.data);
    },

    async uploadAdminRaffleImage(token: string, file: File) {
        const formData = new FormData();

        formData.append("imagen", file);

        const response = await apiRequest<UploadImageResponse>("/uploads/imagen", {
            method: "POST",
            token,
            body: formData,
        });
        const imageUrl = normalizeImageUrl(getUploadedImageUrl(response));

        if (!imageUrl) {
            throw new Error("No pudimos guardar la imagen. Inténtalo nuevamente.");
        }

        return imageUrl;
    },

    deleteAdminRaffle(token: string, raffleId: string) {
        return apiRequest<{ message: string }>(`/admin/sorteos/${encodeURIComponent(raffleId)}`, {
            method: "DELETE",
            token,
        });
    },
};
