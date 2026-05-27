import { useState, type ImgHTMLAttributes } from "react";
import heroImage from "../../../shared/assets/images/hero/hero.jpg";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string;
};

export function EventImage({ src, onError, ...props }: Props) {
    const [failedSrc, setFailedSrc] = useState("");
    const imageSrc = src || heroImage;
    const currentSrc = imageSrc === failedSrc ? heroImage : imageSrc;

    return (
        <img
            {...props}
            src={currentSrc}
            onError={(event) => {
                if (imageSrc !== heroImage) {
                    setFailedSrc(imageSrc);
                }

                onError?.(event);
            }}
        />
    );
}
