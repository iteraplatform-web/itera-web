/**
 * Downscales an image in the browser before it is stored — the same thing a
 * real upload pipeline does server-side. A 12MB phone photo becomes a sensible
 * web-size file plus a small thumbnail for grids.
 */

export interface ProcessedImage {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} could not be read as an image`));
    };
    img.src = url;
  });
}

function render(img: HTMLImageElement, maxEdge: number, quality: number): Promise<{ blob: Blob; w: number; h: number }> {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not available in this browser"));
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, w, h }) : reject(new Error("Could not encode the image"))),
      "image/jpeg",
      quality
    )
  );
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);
  const full = await render(img, 1600, 0.85);
  const thumb = await render(img, 480, 0.75);
  return { full: full.blob, thumb: thumb.blob, width: full.w, height: full.h };
}
