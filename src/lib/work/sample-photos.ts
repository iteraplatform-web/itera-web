import type { TransactionFile } from "@/types";

/**
 * Real photographs for the demonstration's sample files only (see
 * public/sample-photos/CREDITS.md). Files the agent creates or imports show a
 * neutral placeholder until real photos are uploaded — a new client's card
 * never shows a house that isn't theirs.
 */
const SAMPLE_BY_ADDRESS: [string, string][] = [
  ["729 Maple Court", "maple-court.jpg"],
  ["1842 Oakwood Drive", "oakwood-drive.jpg"],
  ["3BR/2BA in Cedar Park", "cedar-park-street.jpg"],
  ["1205 Barton Springs", "barton-springs.jpg"],
  ["3301 Westlake Hills", "westlake-hills.jpg"],
  ["5610 Shoal Creek", "shoal-creek.jpg"],
  ["902 Riverside", "riverside-drive.jpg"],
  ["Condo in downtown Austin", "downtown-condo.jpg"],
];

export function samplePhotoFor(file: Pick<TransactionFile, "propertyAddress">): string | undefined {
  const hit = SAMPLE_BY_ADDRESS.find(([prefix]) => file.propertyAddress.startsWith(prefix));
  return hit ? `/sample-photos/${hit[1]}` : undefined;
}
