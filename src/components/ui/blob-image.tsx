"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getBlobUrl } from "@/lib/files/blob-store";
import { cn } from "@/lib/utils/cn";

/** Reads an uploaded image from IndexedDB and shows it, with a loading shimmer. */
export function useBlobUrl(key: string | undefined) {
  const [url, setUrl] = useState<string | undefined>();
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    setUrl(undefined);
    setMissing(false);
    if (!key) return;
    getBlobUrl(key)
      .then((u) => {
        if (!alive) return;
        if (u) setUrl(u);
        else setMissing(true);
      })
      .catch(() => alive && setMissing(true));
    return () => {
      alive = false;
    };
  }, [key]);
  return { url, missing };
}

export function BlobImage({
  blobKey,
  alt,
  className,
  imgClassName,
}: {
  blobKey: string | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const { url, missing } = useBlobUrl(blobKey);
  return (
    <div className={cn("relative overflow-hidden bg-ink-100", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className={cn("h-full w-full object-cover", imgClassName)} />
      ) : missing ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-400">
          <ImageOff className="h-6 w-6" />
          <span className="text-[12px]">Not on this device</span>
        </div>
      ) : (
        <div className="shimmer h-full w-full" />
      )}
    </div>
  );
}
