"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2, UploadCloud, X } from "lucide-react";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { useUploader } from "@/hooks/use-uploader";
import { processImage } from "@/lib/files/image";
import { deleteBlob, forgetBlobUrl, putBlob } from "@/lib/files/blob-store";
import { formatBytes } from "@/lib/files/upload";
import { formatDate } from "@/lib/utils/dates";
import { BlobImage } from "@/components/ui/blob-image";
import { UploadProgressList } from "@/components/ui/upload-progress";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import type { Photo, TransactionFile } from "@/types";

export function PhotosSection({ file }: { file: TransactionFile }) {
  const user = useAuthStore((s) => s.user);
  const addPhotos = useTransactionsStore((s) => s.addPhotos);
  const removePhoto = useTransactionsStore((s) => s.removePhoto);
  const setCoverPhoto = useTransactionsStore((s) => s.setCoverPhoto);
  const updatePhotoCaption = useTransactionsStore((s) => s.updatePhotoCaption);

  const photos = file.photos ?? [];
  const [viewing, setViewing] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Photo | null>(null);

  const { items, upload, cancel, busy } = useUploader<Photo>({
    kind: "image",
    accept: (f) => (f.type.startsWith("image/") ? null : "Not an image — use JPG, PNG, or HEIC exported as JPG"),
    store: async (f) => {
      const processed = await processImage(f);
      const blobId = `photo-${uuid()}`;
      const thumbBlobId = `${blobId}-thumb`;
      await putBlob(blobId, processed.full);
      await putBlob(thumbBlobId, processed.thumb);
      return {
        id: uuid(),
        name: f.name,
        sizeKb: Math.round(processed.full.size / 1024),
        width: processed.width,
        height: processed.height,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.name ?? "Agent",
        blobId,
        thumbBlobId,
      };
    },
    onBatchDone: (results) => addPhotos(file.id, results),
  });

  const handleDelete = async (photo: Photo) => {
    removePhoto(file.id, photo.id);
    await Promise.all([deleteBlob(photo.blobId), deleteBlob(photo.thumbBlobId)]).catch(() => undefined);
    forgetBlobUrl(photo.blobId);
    forgetBlobUrl(photo.thumbBlobId);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <DropZone onFiles={upload} busy={busy} accept="image/*" title="Add photos" hint="Drag photos here, or click to choose. JPG or PNG, up to 25 MB each. Large photos are resized for the web automatically." />

      <UploadProgressList items={items} onCancel={cancel} />

      {photos.length === 0 && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline-strong bg-canvas px-6 py-12 text-center">
          <ImagePlus className="mx-auto h-8 w-8 text-ink-400" />
          <p className="mt-3 text-[16px] font-semibold text-ink-800">No photos yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-ink-500">
            The first photo you upload becomes the cover image on your dashboard. You can change it any time.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[14px] text-ink-500">
            <span className="tnum font-semibold text-ink-800">{photos.length}</span> photo{photos.length === 1 ? "" : "s"} ·
            click any photo to view it full size
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo, index) => {
              const isCover = file.coverPhotoId === photo.id;
              return (
                <li key={photo.id} className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
                  <button onClick={() => setViewing(index)} className="group relative block w-full" aria-label={`View ${photo.name}`}>
                    <BlobImage blobKey={photo.thumbBlobId} alt={photo.caption || photo.name} className="aspect-[4/3] w-full" imgClassName="transition-transform duration-300 group-hover:scale-[1.03]" />
                    {isCover && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/85 px-2.5 py-1 text-[13px] font-semibold text-white">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        Cover
                      </span>
                    )}
                  </button>
                  <div className="space-y-2.5 p-3.5">
                    <input
                      defaultValue={photo.caption ?? ""}
                      onBlur={(e) => {
                        if ((photo.caption ?? "") !== e.target.value) updatePhotoCaption(file.id, photo.id, e.target.value);
                      }}
                      placeholder="Add a caption, e.g. Kitchen"
                      aria-label="Photo caption"
                      className="w-full rounded-lg border-0 bg-canvas px-3 py-2 text-[14px] text-ink-900 ring-1 ring-inset ring-hairline placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-itera-500"
                    />
                    <p className="text-[13px] text-ink-500">
                      {photo.width}×{photo.height} · {formatBytes(photo.sizeKb * 1024)} · {formatDate(photo.uploadedAt, "MMM d")}
                    </p>
                    <div className="flex gap-2">
                      <Button size="xs" variant="secondary" className="flex-1" disabled={isCover} onClick={() => setCoverPhoto(file.id, photo.id)}>
                        <Star className="h-3.5 w-3.5" />
                        {isCover ? "Cover photo" : "Make cover"}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setConfirmDelete(photo)} aria-label={`Delete ${photo.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {viewing !== null && photos[viewing] && (
        <Lightbox photos={photos} index={viewing} onChange={setViewing} onClose={() => setViewing(null)} />
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this photo?"
        description="It will be removed from this file. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              <Trash2 className="h-4 w-4" />
              Delete photo
            </Button>
          </>
        }
      >
        {confirmDelete && (
          <BlobImage blobKey={confirmDelete.thumbBlobId} alt={confirmDelete.name} className="aspect-[4/3] w-full rounded-xl" />
        )}
      </Modal>
    </div>
  );
}

/** A large, obvious drop target — also a normal button for anyone who does not drag. */
export function DropZone({
  onFiles,
  busy,
  accept,
  title,
  hint,
  multiple = true,
}: {
  onFiles: (files: File[]) => void;
  busy?: boolean;
  accept: string;
  title: string;
  hint: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors sm:flex-row sm:text-left",
        dragging ? "border-itera-500 bg-itera-50" : "border-hairline-strong bg-canvas"
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-itera-600 ring-1 ring-hairline">
        <UploadCloud className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold text-ink-900">{dragging ? "Drop to upload" : title}</p>
        <p className="mt-0.5 text-[14px] text-ink-500">{hint}</p>
      </div>
      <Button onClick={() => inputRef.current?.click()} disabled={busy}>
        <UploadCloud className="h-4 w-4" />
        {busy ? "Uploading…" : "Choose files"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const prev = useCallback(() => onChange((index - 1 + photos.length) % photos.length), [index, photos.length, onChange]);
  const next = useCallback(() => onChange((index + 1) % photos.length), [index, photos.length, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-ink-950/95 animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <p className="min-w-0 truncate text-[15px] font-medium">
          {photo.caption || photo.name}
          <span className="ml-3 text-white/60">
            {index + 1} of {photos.length}
          </span>
        </p>
        <button onClick={onClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold hover:bg-white/10">
          <X className="h-5 w-5" />
          Close
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        <BlobImage blobKey={photo.blobId} alt={photo.caption || photo.name} className="h-full w-full bg-transparent" imgClassName="object-contain" />
        {photos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={next} className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
