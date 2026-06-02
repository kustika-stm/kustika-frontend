export const splitValues = (value: string) => {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
};

export const optionalText = (value: string) => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

export const optionalNumber = (value: string) => {
    return value === "" ? undefined : Number(value);
};
