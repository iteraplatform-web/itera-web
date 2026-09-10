/**
 * Uploaded photos and documents live in the browser's IndexedDB, not in
 * localStorage. localStorage caps out around 5MB and every write is copied
 * to the other tab for live sync — a few photos would break both. The store
 * keeps only small metadata (name, size, key); the bytes stay here.
 */

const DB_NAME = "itera-files";
const STORE = "blobs";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export function putBlob(key: string, blob: Blob): Promise<IDBValidKey> {
  return tx("readwrite", (s) => s.put(blob, key));
}

export function getBlob(key: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>("readonly", (s) => s.get(key) as IDBRequest<Blob | undefined>);
}

export function deleteBlob(key: string): Promise<undefined> {
  return tx("readwrite", (s) => s.delete(key));
}

/* Object URLs are cached per key so a grid of thumbnails does not re-read
   IndexedDB on every render, and so the same URL is revoked exactly once. */
const urlCache = new Map<string, string>();

export async function getBlobUrl(key: string): Promise<string | undefined> {
  const cached = urlCache.get(key);
  if (cached) return cached;
  const blob = await getBlob(key);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export function forgetBlobUrl(key: string): void {
  const url = urlCache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(key);
  }
}
