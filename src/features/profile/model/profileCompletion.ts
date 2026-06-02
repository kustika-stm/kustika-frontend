import type { SessionUser } from "../../../entities/session";

export type RequiredProfileField = "nombre" | "apellido_paterno" | "apellido_materno" | "email" | "telefono";

export const requiredProfileFields: Array<{
    key: RequiredProfileField;
    label: string;
}> = [
    { key: "nombre", label: "Nombre" },
    { key: "apellido_paterno", label: "Apellido paterno" },
    { key: "apellido_materno", label: "Apellido materno" },
    { key: "email", label: "Correo" },
    { key: "telefono", label: "Teléfono" },
];

export const isProfileFieldFilled = (value?: string | null) => {
    return Boolean(value?.trim());
};

export const getMissingProfileFields = (profile?: Partial<SessionUser> | null) => {
    return requiredProfileFields.filter(({ key }) => !isProfileFieldFilled(profile?.[key]));
};

export const isProfileComplete = (profile?: Partial<SessionUser> | null) => {
    return getMissingProfileFields(profile).length === 0;
};
