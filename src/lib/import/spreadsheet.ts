import * as XLSX from "xlsx";
import type { IntakeAnswers, TransactionFile, TransactionStatus } from "@/types";
import type { ImportedFile } from "@/stores/transactions-store";

/* ────────────────────────────────────────────────────────────────────────
 * The import format
 *
 * One row per listing or buyer. Headers are matched loosely — "Client",
 * "Client Name" and "client_name" all work — so an agent's existing
 * spreadsheet usually imports without renaming anything. Any column ITERA
 * does not recognise is kept as an extra detail on the file, not dropped.
 * ──────────────────────────────────────────────────────────────────────── */

type ColumnKind = "text" | "email" | "phone" | "yesno" | "side" | "money" | "rate" | "percent" | "date" | "status";

export interface ColumnDef {
  key: string;
  header: string;
  kind: ColumnKind;
  required: boolean | "listing";
  aliases: string[];
  help: string;
  example: [string, string, string];
}

export const COLUMNS: ColumnDef[] = [
  { key: "clientName", header: "Client Name", kind: "text", required: true, aliases: ["client", "name", "seller", "buyer name", "customer"], help: "Full name. Couples can be written as \"James & Linda Chen\".", example: ["Daniel Okafor", "Maria Delgado", "Chen Family"] },
  { key: "phone", header: "Phone", kind: "phone", required: true, aliases: ["phone number", "mobile", "cell", "telephone", "tel"], help: "Any format — (555) 412-7788 or 5554127788.", example: ["(555) 412-7788", "555-220-9911", "(555) 345-6789"] },
  { key: "email", header: "Email", kind: "email", required: true, aliases: ["email address", "e-mail", "mail"], help: "Also creates the client's portal access in the full product.", example: ["daniel.okafor@email.com", "maria.delgado@work.com", "chen.family@email.com"] },
  { key: "side", header: "Listing or Buying", kind: "side", required: true, aliases: ["side", "type", "transaction type", "listing/buying", "deal type"], help: "Listing (selling) or Buying.", example: ["Listing", "Buying", "Listing"] },
  { key: "propertyAddress", header: "Property Address or Search", kind: "text", required: true, aliases: ["address", "property", "property address", "search criteria", "location"], help: "Street address for listings; what they want for buyers.", example: ["4118 Meadowbrook Lane, Austin TX 78745", "3BR in Round Rock under $450K", "729 Maple Court, Round Rock TX"] },
  { key: "isReferral", header: "Referral", kind: "yesno", required: true, aliases: ["is referral", "referral?", "referred"], help: "Yes or No.", example: ["Yes", "No", "No"] },
  { key: "isRelocation", header: "Relocation", kind: "yesno", required: true, aliases: ["is relocation", "relocation?", "relo"], help: "Yes or No.", example: ["No", "Yes", "No"] },
  { key: "builtBefore1978", header: "Built Before 1978", kind: "yesno", required: "listing", aliases: ["pre 1978", "pre-1978", "built before 1978?", "lead paint"], help: "Yes or No. Required for listings; leave blank for buyers.", example: ["Yes", "", "Yes"] },
  { key: "referralSource", header: "Referral Source", kind: "text", required: false, aliases: ["referred by", "referral from"], help: "Who referred them.", example: ["Hartley Team", "", ""] },
  { key: "referralPercentage", header: "Referral %", kind: "percent", required: false, aliases: ["referral percent", "referral fee", "referral percentage"], help: "Fee to the referring broker, e.g. 25%.", example: ["25%", "", ""] },
  { key: "listPrice", header: "Price", kind: "money", required: false, aliases: ["list price", "sale price", "budget", "target price", "amount"], help: "List price, or the buyer's target. $450,000 or 450k.", example: ["$615,000", "$450,000", "$489,000"] },
  { key: "commissionRate", header: "Commission %", kind: "rate", required: false, aliases: ["commission", "commission rate", "rate"], help: "Your side's rate, e.g. 3%. Defaults to 3%.", example: ["3%", "2.5%", "2.5%"] },
  { key: "status", header: "Status", kind: "status", required: false, aliases: ["stage", "file status"], help: "Prospective, Listed, Buyer Agency, In Progress, Under Contract, Closed, Dropped, or Terminated.", example: ["Prospective", "Buyer Agency", "Under Contract"] },
  { key: "closingDate", header: "Closing Date", kind: "date", required: false, aliases: ["close date", "closing", "coe"], help: "Deadlines are worked out back from this date.", example: ["", "", "10/15/2026"] },
  { key: "leadSource", header: "Lead Source", kind: "text", required: false, aliases: ["source", "how they found us"], help: "Zillow, open house, past client…", example: ["Referral", "Zillow", "Past Client"] },
  { key: "coClientName", header: "Co-Client", kind: "text", required: false, aliases: ["spouse", "co-client name", "partner"], help: "Spouse or co-buyer.", example: ["", "Luis Delgado", "Linda Chen"] },
  { key: "coClientContact", header: "Co-Client Contact", kind: "text", required: false, aliases: ["spouse phone", "co-client phone"], help: "Phone or email.", example: ["", "(555) 220-9912", ""] },
  { key: "preferredContact", header: "Preferred Contact", kind: "text", required: false, aliases: ["contact method", "prefers"], help: "Text, Phone, or Email.", example: ["Text", "Email", "Email"] },
  { key: "preferredContactTime", header: "Best Time", kind: "text", required: false, aliases: ["best time to call", "contact time"], help: "e.g. Evenings after 6.", example: ["Calls after 6pm", "Weekday mornings", ""] },
  { key: "petNames", header: "Pets", kind: "text", required: false, aliases: ["pet names", "pet"], help: "Worth knowing before showings.", example: ["Basil and Juno (dogs)", "", ""] },
  { key: "websiteOrSocial", header: "Website or Social", kind: "text", required: false, aliases: ["website", "linkedin", "instagram", "social"], help: "Optional.", example: ["", "", ""] },
  { key: "note", header: "Notes", kind: "text", required: false, aliases: ["note", "comments", "remarks"], help: "Saved as the file's first note.", example: ["Wants to list within 3 weeks", "Start date at new job is the 3rd", ""] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%]/g, "");

/* ── Template ────────────────────────────────────────────────────────── */

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const rows = [COLUMNS.map((c) => c.header), ...[0, 1, 2].map((i) => COLUMNS.map((c) => c.example[i]))];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(14, c.header.length + 4, ...c.example.map((e) => e.length + 2)) }));
  XLSX.utils.book_append_sheet(wb, sheet, "Listings");

  const help = XLSX.utils.aoa_to_sheet([
    ["Column", "Required?", "What to enter"],
    ...COLUMNS.map((c) => [c.header, c.required === true ? "Required" : c.required === "listing" ? "Required for listings" : "Optional", c.help]),
    [],
    ["Tip", "", "Delete the three example rows before adding your own. Extra columns are kept as extra details on each file."],
  ]);
  help["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, help, "Instructions");

  XLSX.writeFile(wb, "ITERA-import-template.xlsx");
}

/* ── Reading ─────────────────────────────────────────────────────────── */

export interface SheetData {
  sheetName: string;
  headers: string[];
  /** Raw cell values, one array per data row, aligned with headers. */
  rows: unknown[][];
  /** Spreadsheet row number of each data row, for pointing at problems. */
  rowNumbers: number[];
}

export async function readSpreadsheet(file: File): Promise<SheetData> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  // Prefer a sheet called "Listings"; otherwise the first one that isn't instructions.
  const sheetName =
    wb.SheetNames.find((n) => norm(n) === "listings") ??
    wb.SheetNames.find((n) => !norm(n).includes("instruction")) ??
    wb.SheetNames[0];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, blankrows: false, defval: "" });

  // The header row is the first with at least three filled cells — tolerates
  // a title line or blank rows above the table.
  const headerIdx = grid.findIndex((r) => r.filter((c) => String(c).trim() !== "").length >= 3);
  if (headerIdx === -1) throw new Error("Couldn't find a header row. The first row should contain column names like Client Name and Phone.");

  const headers = grid[headerIdx].map((h) => String(h).trim());
  const rows: unknown[][] = [];
  const rowNumbers: number[] = [];
  grid.slice(headerIdx + 1).forEach((r, i) => {
    if (r.some((c) => String(c).trim() !== "")) {
      rows.push(headers.map((_, ci) => r[ci] ?? ""));
      rowNumbers.push(headerIdx + i + 2);
    }
  });
  return { sheetName, headers, rows, rowNumbers };
}

/* ── Matching columns ────────────────────────────────────────────────── */

export interface ColumnMapping {
  /** Sheet column index → ITERA column key, or null to keep it as an extra detail. */
  byIndex: (string | null)[];
  missingRequired: ColumnDef[];
}

export function matchColumns(headers: string[]): ColumnMapping {
  const used = new Set<string>();
  const byIndex = headers.map((h) => {
    const n = norm(h);
    if (!n) return null;
    const col = COLUMNS.find((c) => !used.has(c.key) && (norm(c.header) === n || c.aliases.some((a) => norm(a) === n)));
    if (col) used.add(col.key);
    return col?.key ?? null;
  });
  const missingRequired = COLUMNS.filter((c) => c.required === true && !used.has(c.key));
  return { byIndex, missingRequired };
}

/* ── Checking rows ───────────────────────────────────────────────────── */

export interface RowIssue {
  column: string;
  message: string;
  severity: "error" | "warning";
}

export interface CheckedRow {
  rowNumber: number;
  result?: ImportedFile;
  issues: RowIssue[];
  duplicateOf?: string;
  /** Short label for the review table. */
  summary: { client: string; side: string; address: string; price?: number };
}

const YES = new Set(["yes", "y", "true", "1", "x", "✓"]);
const NO = new Set(["no", "n", "false", "0", ""]);

const STATUS_WORDS: Record<string, TransactionStatus> = {
  prospective: "prospective",
  prospect: "prospective",
  lead: "prospective",
  listed: "listed",
  active: "listed",
  buyeragency: "buyer_agency",
  inprogress: "in_progress",
  searching: "in_progress",
  undercontract: "under_contract",
  pending: "under_contract",
  closed: "closed",
  sold: "closed",
  dropped: "dropped",
  terminated: "terminated",
  cancelled: "terminated",
};

function toText(v: unknown) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").trim();
}

function parseMoney(v: unknown): number | null {
  if (typeof v === "number") return v;
  const s = toText(v).toLowerCase().replace(/[$,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
  if (!m) return NaN;
  return Number(m[1]) * (m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1_000 : 1);
}

/** "3%", "3", or 0.03 all mean three percent. Returns a percent number. */
function parsePercent(v: unknown): number | null {
  if (typeof v === "number") return v <= 1 ? v * 100 : v;
  const s = toText(v).replace(/[%\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  if (isNaN(n)) return NaN;
  return n <= 1 && s.includes(".") ? n * 100 : n;
}

function parseDate(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12).toISOString();
  const s = toText(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? "invalid" : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString();
}

const addressKey = (a: string) => a.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);

export function checkRows(
  sheet: SheetData,
  mapping: ColumnMapping,
  existing: TransactionFile[],
  from: number,
  to: number,
  seenInSheet: Map<string, number>
): CheckedRow[] {
  const existingByAddress = new Map(existing.map((f) => [addressKey(f.propertyAddress), f.propertyAddress]));
  const out: CheckedRow[] = [];

  for (let r = from; r < Math.min(to, sheet.rows.length); r++) {
    const raw = sheet.rows[r];
    const rowNumber = sheet.rowNumbers[r];
    const issues: RowIssue[] = [];
    const v: Record<string, unknown> = {};
    const extras: { label: string; value: string }[] = [];

    mapping.byIndex.forEach((key, ci) => {
      if (key) v[key] = raw[ci];
      else if (sheet.headers[ci] && toText(raw[ci])) extras.push({ label: sheet.headers[ci], value: toText(raw[ci]) });
    });

    const header = (key: string) => COLUMNS.find((c) => c.key === key)!.header;
    const err = (key: string, message: string) => issues.push({ column: header(key), message, severity: "error" });
    const warn = (key: string, message: string) => issues.push({ column: header(key), message, severity: "warning" });

    const clientName = toText(v.clientName);
    if (!clientName) err("clientName", "Missing — every file needs a client name");

    const phone = toText(v.phone);
    const digits = phone.replace(/\D/g, "");
    if (!phone) err("phone", "Missing");
    else if (digits.length < 10) warn("phone", `"${phone}" looks too short to be a full number`);

    const email = toText(v.email);
    if (!email) err("email", "Missing");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err("email", `"${email}" isn't a valid email address`);

    const sideRaw = norm(toText(v.side));
    let side: IntakeAnswers["side"] | null = null;
    if (["listing", "list", "seller", "sell", "selling"].includes(sideRaw)) side = "listing";
    else if (["buying", "buy", "buyer", "purchase", "purchasing"].includes(sideRaw)) side = "buying";
    else err("side", sideRaw ? `"${toText(v.side)}" — use Listing or Buying` : "Missing — Listing or Buying");

    const propertyAddress = toText(v.propertyAddress);
    if (!propertyAddress) err("propertyAddress", "Missing");

    const yesNo = (key: string, required: boolean): boolean | undefined => {
      const s = toText(v[key]).toLowerCase();
      if (YES.has(s)) return true;
      if (s === "" && required) {
        err(key, "Missing — Yes or No");
        return undefined;
      }
      if (NO.has(s)) return false;
      err(key, `"${toText(v[key])}" — use Yes or No`);
      return undefined;
    };
    const isReferral = yesNo("isReferral", true);
    const isRelocation = yesNo("isRelocation", true);
    const builtBefore1978 = side === "listing" ? yesNo("builtBefore1978", true) : undefined;

    const referralPct = parsePercent(v.referralPercentage);
    if (referralPct !== null && isNaN(referralPct)) err("referralPercentage", `"${toText(v.referralPercentage)}" isn't a percentage`);
    if (isReferral && referralPct === null) warn("referralPercentage", "Referral with no fee % — payout will assume 0%");

    const price = parseMoney(v.listPrice);
    if (price !== null && isNaN(price)) err("listPrice", `"${toText(v.listPrice)}" isn't an amount`);

    const ratePct = parsePercent(v.commissionRate);
    if (ratePct !== null && (isNaN(ratePct) || ratePct <= 0 || ratePct > 10)) err("commissionRate", `"${toText(v.commissionRate)}" doesn't look like a commission rate`);

    let status: TransactionStatus | undefined;
    const statusText = toText(v.status);
    if (statusText) {
      status = STATUS_WORDS[norm(statusText)];
      if (!status) err("status", `"${statusText}" isn't a status ITERA knows`);
      else if (side === "buying" && status === "listed") warn("status", "Buyers can't be Listed — will use In Progress");
      else if (side === "listing" && status === "buyer_agency") warn("status", "Listings can't be Buyer Agency — will use Prospective");
    }
    if (status === "listed" && side === "buying") status = "in_progress";
    if (status === "buyer_agency" && side === "listing") status = "prospective";

    const closing = parseDate(v.closingDate);
    if (closing === "invalid") err("closingDate", `"${toText(v.closingDate)}" isn't a date`);

    // Duplicates: already in ITERA, or twice in this sheet.
    let duplicateOf: string | undefined;
    if (propertyAddress && side === "listing") {
      const key = addressKey(propertyAddress);
      if (existingByAddress.has(key)) duplicateOf = `Already in ITERA as ${existingByAddress.get(key)}`;
      else if (seenInSheet.has(key)) duplicateOf = `Same address as row ${seenInSheet.get(key)}`;
      else seenInSheet.set(key, rowNumber);
    }

    const hasError = issues.some((i) => i.severity === "error");
    out.push({
      rowNumber,
      issues,
      duplicateOf,
      summary: { client: clientName || "(no name)", side: side === "listing" ? "Listing" : side === "buying" ? "Buying" : "?", address: propertyAddress || "(no address)", price: price && !isNaN(price) ? price : undefined },
      result: hasError
        ? undefined
        : {
            answers: {
              clientName,
              phone,
              email,
              side: side!,
              propertyAddress,
              isReferral: isReferral!,
              isRelocation: isRelocation!,
              builtBefore1978,
              referralSource: isReferral ? toText(v.referralSource) || undefined : undefined,
              referralPercentage: isReferral && referralPct !== null ? referralPct : undefined,
              leadSource: toText(v.leadSource) || undefined,
              coClientName: toText(v.coClientName) || undefined,
              coClientContact: toText(v.coClientContact) || undefined,
              websiteOrSocial: toText(v.websiteOrSocial) || undefined,
              petNames: toText(v.petNames) || undefined,
              preferredContact: toText(v.preferredContact) || undefined,
              preferredContactTime: toText(v.preferredContactTime) || undefined,
            },
            status,
            listPrice: price && !isNaN(price) ? price : undefined,
            commissionRate: ratePct ? ratePct / 100 : undefined,
            closingDate: closing && closing !== "invalid" ? closing : undefined,
            note: toText(v.note) || undefined,
            customFields: extras,
          },
    });
  }
  return out;
}

/* ── Sample file for demonstrations ──────────────────────────────────── */

/**
 * A realistic spreadsheet an agent might already keep: their own column
 * names, a stray extra column, one duplicate, and a couple of mistakes —
 * so the checks have something real to catch.
 */
export function buildSampleSpreadsheet(): File {
  const header = ["Client", "Phone", "Email", "Side", "Address", "Referral", "Relocation", "Pre-1978", "Referral %", "List Price", "Commission", "Stage", "Closing Date", "Source", "Spouse", "Gate Code", "Notes"];
  const rows = [
    ["Priya & Arjun Nair", "(555) 301-4420", "nair.family@email.com", "Listing", "2207 Sycamore Trail, Austin TX 78745", "No", "No", "Yes", "", "$735,000", "3%", "Listed", "", "Open House", "Arjun Nair", "4471", "Motivated — new build closes in December"],
    ["Greg Holloway", "5552108833", "greg.holloway@email.com", "Buying", "3BR/2BA in Georgetown under $500K", "Yes", "Yes", "", "25%", "480k", "2.5%", "Buyer Agency", "", "Corporate referral", "", "", "Relocating from Seattle with Amazon"],
    ["Lena Fischer", "(555) 772-0019", "lena.fischer@email.com", "Listing", "118 Pecan Grove Ct, Round Rock TX 78664", "No", "No", "No", "", "$429,900", "3%", "Under Contract", "11/14/2026", "Past Client", "", "1990", ""],
    ["Marcus & Dana Webb", "(555) 640-2231", "webb.home@email", "Listing", "9 Hillcrest Dr, Cedar Park TX 78613", "No", "No", "Maybe", "", "$559,000", "3%", "Prospective", "", "Zillow", "Dana Webb", "", "Email address came from the open house sign-in sheet"],
    ["Sofia Ramirez", "(555) 918-3345", "sofia.r@email.com", "Buying", "Condo downtown, $300–350K", "No", "No", "", "", "$340,000", "3%", "In Progress", "", "Instagram", "", "", "Pre-approved with Frost Bank"],
    ["Tom Brennan", "(555) 204-7781", "tbrennan@email.com", "Listing", "729 Maple Court, Round Rock, TX 78664", "No", "No", "Yes", "", "$489,000", "2.5%", "Listed", "", "Sign Call", "", "", "Says his neighbour already listed with us"],
    ["Aisha Coleman", "(555) 385-6620", "aisha.coleman@email.com", "Listing", "4502 Ridgeview Ln, Pflugerville TX 78660", "Yes", "No", "No", "30%", "$398,000", "3%", "Prospective", "", "Referral", "", "", "Referred by the Morgan Group"],
    ["", "(555) 111-2233", "unknown@email.com", "Buying", "Anywhere in Leander", "No", "No", "", "", "", "", "", "", "", "", "", "Row left half-finished"],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...rows]), "Listings");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([out], "My listings - Sept 2026.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
