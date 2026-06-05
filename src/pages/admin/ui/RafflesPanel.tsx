import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import type { Raffle } from "../../../entities/raffle";
import { raffleStatusOptions } from "../model/adminUtils";
import styles from "../admin.module.css";

type RafflesPanelProps = {
    raffles: Raffle[];
    featuredRaffles: number;
    totalRaffleTickets: number;
    editingRaffle: Raffle | null;
    isLoading: boolean;
    processingRaffleId: string | null;
    onSubmitRaffle: (event: FormEvent<HTMLFormElement>) => void;
    onEditRaffle: (raffle: Raffle) => void;
    onCancelEdit: () => void;
    onDeleteRaffle: (raffle: Raffle) => void;
    onRefresh: () => void;
};

export function RafflesPanel({
    raffles,
    featuredRaffles,
    totalRaffleTickets,
    editingRaffle,
    isLoading,
    processingRaffleId,
    onSubmitRaffle,
    onEditRaffle,
    onCancelEdit,
    onDeleteRaffle,
    onRefresh,
}: RafflesPanelProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const currentRaffleKey = editingRaffle?.id ?? "new-raffle";
    const [imageSelection, setImageSelection] = useState({
        key: currentRaffleKey,
        name: "",
        previewUrl: "",
    });
    const selectedImageName = imageSelection.key === currentRaffleKey ? imageSelection.name : "";
    const previewUrl = imageSelection.key === currentRaffleKey ? imageSelection.previewUrl : "";
    const currentImageUrl = previewUrl || editingRaffle?.image || "";

    useEffect(() => {
        return () => {
            if (imageSelection.previewUrl) {
                URL.revokeObjectURL(imageSelection.previewUrl);
            }
        };
    }, [imageSelection.previewUrl]);

    const setSelectedFile = (file?: File) => {
        if (!file) {
            return;
        }

        if (imageSelection.previewUrl) {
            URL.revokeObjectURL(imageSelection.previewUrl);
        }

        setImageSelection({
            key: currentRaffleKey,
            name: file.name,
            previewUrl: URL.createObjectURL(file),
        });
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(event.target.files?.[0]);
    };

    const handleImageDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));

        if (!file || !fileInputRef.current) {
            return;
        }

        const transfer = new DataTransfer();

        transfer.items.add(file);
        fileInputRef.current.files = transfer.files;
        setSelectedFile(file);
    };

    return (
        <>
            <section className={styles.statsGrid} aria-label="Resumen de sorteos">
                <article>
                    <span>Total sorteos</span>
                    <strong>{raffles.length}</strong>
                </article>
                <article>
                    <span>Destacados</span>
                    <strong>{featuredRaffles}</strong>
                </article>
                <article>
                    <span>Boletos vendidos</span>
                    <strong>{totalRaffleTickets.toLocaleString("es-MX")}</strong>
                </article>
            </section>

            <section className={styles.raffleLayout}>
                <form
                    className={`${styles.panel} ${styles.raffleForm}`}
                    onSubmit={onSubmitRaffle}
                    key={editingRaffle?.id ?? "new-raffle"}
                >
                    <div className={styles.panelHeader}>
                        <div>
                            <span>Sorteos</span>
                            <h2>{editingRaffle ? "Editar sorteo" : "Crear sorteo"}</h2>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <label>
                            Titulo
                            <input name="title" type="text" placeholder="Experiencia de lujo en Ibiza" defaultValue={editingRaffle?.title ?? ""} required />
                        </label>
                        <label>
                            Subtitulo
                            <input name="subtitle" type="text" placeholder="Viaje completo para dos personas" defaultValue={editingRaffle?.subtitle ?? ""} required />
                        </label>
                        <label className={styles.fullField}>
                            Descripción
                            <textarea name="description" rows={4} placeholder="Describe el premio y lo que incluye." defaultValue={editingRaffle?.description ?? ""} required />
                        </label>
                        <label>
                            Precio por boleto
                            <input name="ticketPrice" type="number" min="0" step="0.01" placeholder="19.99" defaultValue={editingRaffle?.ticketPrice ?? ""} required />
                        </label>
                        <label>
                            Entradas
                            <input name="entries" type="text" placeholder="5,432 entradas" defaultValue={editingRaffle?.entries ?? ""} required />
                        </label>
                        <label>
                            Termina en
                            <input name="endsIn" type="text" placeholder="23:59:05" defaultValue={editingRaffle?.endsIn ?? ""} required />
                        </label>
                        <label>
                            Estado
                            <select name="status" defaultValue={editingRaffle?.status ?? "trending"}>
                                {raffleStatusOptions.map((option) => (
                                    <option value={option.value} key={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <input name="image" type="hidden" value={editingRaffle?.image ?? ""} readOnly />
                        <label
                            className={`${styles.fullField} ${styles.imageDropZone}`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={handleImageDrop}
                        >
                            Imagen
                            <input
                                ref={fileInputRef}
                                name="imageFile"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required={!editingRaffle}
                            />
                            <span>{selectedImageName || (editingRaffle ? "Arrastra una nueva imagen o conserva la actual" : "Arrastra una imagen o haz clic para subir")}</span>
                            {currentImageUrl && <img src={currentImageUrl} alt="" aria-hidden="true" />}
                        </label>
                        <label className={styles.checkboxField}>
                            <input name="featured" type="checkbox" defaultChecked={editingRaffle?.featured ?? false} />
                            Marcar como sorteo destacado
                        </label>
                    </div>

                    <div className={styles.formActions}>
                        {editingRaffle && (
                            <button type="button" onClick={onCancelEdit} disabled={processingRaffleId === editingRaffle.id}>
                                Cancelar
                            </button>
                        )}
                        <button type="submit" disabled={processingRaffleId === (editingRaffle?.id ?? "new")}>
                            {processingRaffleId === (editingRaffle?.id ?? "new") ? "Guardando" : editingRaffle ? "Guardar cambios" : "Crear sorteo"}
                        </button>
                    </div>
                </form>

                <section className={`${styles.panel} ${styles.rafflePreviewPanel}`}>
                    <div className={styles.panelHeader}>
                        <div>
                            <span>Catalogo admin</span>
                            <h2>Sorteos creados</h2>
                        </div>
                        <button type="button" onClick={onRefresh} disabled={isLoading}>
                            {isLoading ? "Cargando" : "Actualizar"}
                        </button>
                    </div>

                    <div className={styles.rafflePreviewList}>
                        {isLoading && (
                            <div className={styles.emptyState}>
                                <strong>Cargando sorteos</strong>
                                <p>Estamos consultando el catálogo de sorteos.</p>
                            </div>
                        )}

                        {!isLoading && raffles.length === 0 && (
                            <div className={styles.emptyState}>
                                <strong>No hay sorteos creados</strong>
                                <p>Crea el primer sorteo desde el formulario.</p>
                            </div>
                        )}

                        {!isLoading && raffles.map((raffle) => (
                            <article className={styles.rafflePreview} key={raffle.id}>
                                <img src={raffle.image} alt="" aria-hidden="true" />
                                <div>
                                    <span>{raffle.featured ? "Destacado" : raffleStatusOptions.find((option) => option.value === raffle.status)?.label}</span>
                                    <strong>{raffle.title}</strong>
                                    <p>{raffle.subtitle}</p>
                                    <small>{raffle.price} / boleto - {raffle.ticketsSold} vendidos</small>
                                    <div className={styles.rowActions}>
                                        <button type="button" onClick={() => onEditRaffle(raffle)} disabled={processingRaffleId === raffle.id}>
                                            Editar
                                        </button>
                                        <button type="button" onClick={() => onDeleteRaffle(raffle)} disabled={processingRaffleId === raffle.id}>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </section>
        </>
    );
}
