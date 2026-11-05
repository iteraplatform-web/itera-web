import type { ListingGuideline, ShowingsWork, TransactionFile, VisitorAlertFields } from "@/types";

export interface VisitorAlertLine {
  id: "cameras" | "pets" | "note";
  title: string;
  detail: string;
}

export function emptyVisitorAlerts(): VisitorAlertFields {
  return {
    camerasOn: false,
    cameraNote: "",
    petsOnSite: false,
    petInstructions: "",
    importantNote: "",
  };
}

/** Reads the loud warnings, and guesses them on files saved before these boxes existed. */
export function alertsFromShowings(showings?: Partial<ShowingsWork>): VisitorAlertFields {
  const guidelines = showings?.guidelines ?? [];
  const petInstructions = showings?.petInstructions ?? "";
  const mentionsCameras = guidelines.some((rule) => /camera/i.test(rule.text));
  const petsNamed =
    petInstructions.trim().length > 0 && !/^no pets\b/i.test(petInstructions.trim());
  return {
    camerasOn: showings?.camerasOn ?? mentionsCameras,
    cameraNote: showings?.cameraNote ?? "",
    petsOnSite: showings?.petsOnSite ?? petsNamed,
    petInstructions,
    importantNote: showings?.importantNote ?? "",
  };
}

export function visitorAlertLines(fields: VisitorAlertFields): VisitorAlertLine[] {
  const lines: VisitorAlertLine[] = [];
  if (fields.camerasOn) {
    lines.push({
      id: "cameras",
      title: "Security cameras are on",
      detail:
        fields.cameraNote.trim() ||
        "Cameras are installed and active. People in the house are being recorded.",
    });
  }
  if (fields.petsOnSite) {
    lines.push({
      id: "pets",
      title: "Pets are in the house",
      detail:
        fields.petInstructions.trim() ||
        "A dog or cat is on the property. Check with the listing agent before you open a door.",
    });
  }
  const note = fields.importantNote.trim();
  if (note) {
    lines.push({
      id: "note",
      title: "Special instruction",
      detail: note,
    });
  }
  return lines;
}

/** Guidelines that are not already shouted in the bright warning box. */
export function routineGuidelines(
  showings: Partial<ShowingsWork> | undefined,
  alerts: VisitorAlertFields
): ListingGuideline[] {
  return (showings?.guidelines ?? []).filter((rule) => {
    const text = rule.text.trim();
    if (!text) return false;
    if (alerts.camerasOn && /camera/i.test(text)) return false;
    if (alerts.petsOnSite && /\b(dog|cat|pet|pets)\b/i.test(text)) return false;
    return true;
  });
}

export function hasVisitorInfo(showings?: Partial<ShowingsWork>): boolean {
  if (!showings) return false;
  const alerts = alertsFromShowings(showings);
  return visitorAlertLines(alerts).length > 0 || routineGuidelines(showings, alerts).length > 0;
}

export function visitorAlertEmail(showings?: Partial<ShowingsWork>): string {
  const lines = visitorAlertLines(alertsFromShowings(showings));
  if (!lines.length) return "";
  return [
    "IMPORTANT — read this before you arrive:",
    ...lines.map((line) => `• ${line.title}. ${line.detail}`),
    "",
  ].join("\n");
}

function addressKey(value: string): string {
  return value
    .toLowerCase()
    .split(",")[0]
    .replace(/[.#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Finds a listing folder whose street matches the house being toured. */
export function findListingForAddress(
  files: TransactionFile[],
  address: string
): TransactionFile | undefined {
  const key = addressKey(address);
  if (key.length < 5) return undefined;
  return files.find(
    (file) => file.side === "listing" && addressKey(file.propertyAddress || "") === key
  );
}
