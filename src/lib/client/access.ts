import type { PortalAccess, PortalVisibility } from "@/types";

export const DEFAULT_VISIBILITY: PortalVisibility = {
  progress: true,
  documents: true,
  property: true,
  showingFeedback: true,
  money: true,
};

// Easy to read aloud or type on a phone: no 0/O or 1/l confusion.
const WORDS = ["maple", "cedar", "harbor", "willow", "summit", "meadow", "river", "aspen", "juniper", "canyon", "birch", "laurel"];

/**
 * A readable temporary password like "cedar-4821". Seeded from the email so
 * sample clients always get the same login in every browser; new clients get
 * a random one.
 */
export function makeTempPassword(seed?: string): string {
  let n: number;
  if (seed) {
    n = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  } else {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    n = buf[0];
  }
  const word = WORDS[n % WORDS.length];
  const digits = String(1000 + (Math.floor(n / WORDS.length) % 9000));
  return `${word}-${digits}`;
}

export function createPortalAccess(email: string, seeded = false): PortalAccess | undefined {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) return undefined;
  return {
    email: clean,
    password: makeTempPassword(seeded ? clean : undefined),
    enabled: true,
    createdAt: new Date().toISOString(),
    visibility: { ...DEFAULT_VISIBILITY },
  };
}
