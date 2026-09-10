/**
 * Builds a small, valid PDF on demand. Documents that arrived with the sample
 * data were never uploaded by anyone, but "View" should still open a real
 * document — so one is written here with the file's details on it.
 */

function escapePdf(text: string): string {
  // Standard Type1 fonts are Latin-1; drop anything outside it.
  return text.replace(/[^\x20-\x7e]/g, "-").replace(/([\\()])/g, "\\$1");
}

export function makePlaceholderPdf(title: string, lines: string[]): Blob {
  const content: string[] = ["BT", "/F2 20 Tf", "56 760 Td", `(${escapePdf(title)}) Tj`, "ET"];
  let y = 724;
  for (const line of lines) {
    content.push("BT", "/F1 11 Tf", `56 ${y} Td`, `(${escapePdf(line)}) Tj`, "ET");
    y -= 18;
  }
  // A thin rule under the title
  content.push("0.85 0.85 0.85 RG", "56 745 m 556 745 l S");
  const stream = content.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}
