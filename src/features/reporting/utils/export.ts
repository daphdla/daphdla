"use client";

/**
 * Export utilities for PDF and Excel
 * PDF: jsPDF + jspdf-autotable
 * Excel: xlsx (SheetJS)
 */

// ─── Excel Export ──────────────────────────────────────────────────────────

export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Data"
): Promise<void> {
  // Dynamic import for code splitting
  const XLSX = await import("xlsx");

  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-width columns
  const colWidths = Object.keys(data[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, 12),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF Export ────────────────────────────────────────────────────────────

export async function exportPortfolioToPDF(
  companies: Array<{
    name: string;
    sector: string;
    country: string;
    status: string;
    investedAmount: number;
    currentValue: number;
    moic: number;
    irr?: number | null;
  }>,
  fundName: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  // @ts-expect-error — jspdf-autotable extends prototype
  await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(31, 27, 75);
  doc.text("PE Platform — Rapport Portfolio", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fonds : ${fundName}`, 14, 28);
  doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 14, 34);

  // Table
  const headers = [["Société", "Secteur", "Pays", "Statut", "Investi (M€)", "Valeur (M€)", "MOIC", "TRI"]];
  const rows = companies.map((c) => [
    c.name,
    c.sector,
    c.country,
    c.status,
    c.investedAmount.toFixed(1),
    c.currentValue.toFixed(1),
    `${c.moic.toFixed(2)}x`,
    c.irr != null ? `${(c.irr * 100).toFixed(1)}%` : "—",
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    head: headers,
    body: rows,
    startY: 42,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
  });

  doc.save(`portfolio-${fundName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ─── LP Report PDF ─────────────────────────────────────────────────────────

export async function exportLPReportToPDF(params: {
  lpName: string;
  fundName: string;
  commitment: number;
  called: number;
  distributed: number;
  nav: number;
  tvpi: number;
  dpi: number;
  irr: number;
}): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF();

  // Header bar
  doc.setFillColor(15, 14, 46);
  doc.rect(0, 0, 210, 40, "F");

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("Rapport LP", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11);
  doc.text("PE Platform — Private & Confidential", 14, 30);

  // Info section
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);

  const info = [
    ["LP", params.lpName],
    ["Fonds", params.fundName],
    ["Date du rapport", new Date().toLocaleDateString("fr-FR")],
  ];

  let y = 55;
  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 60, y);
    y += 8;
  });

  // KPIs
  y += 10;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Métriques de Performance", 14, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const kpis = [
    ["Engagement total", `€${params.commitment.toFixed(1)}M`],
    ["Capital appelé", `€${params.called.toFixed(1)}M`],
    ["Distributions reçues", `€${params.distributed.toFixed(1)}M`],
    ["Valeur actuelle (NAV)", `€${params.nav.toFixed(1)}M`],
    ["TVPI", `${params.tvpi.toFixed(2)}x`],
    ["DPI", `${params.dpi.toFixed(2)}x`],
    ["TRI Net", `${(params.irr * 100).toFixed(1)}%`],
  ];

  kpis.forEach(([label, value]) => {
    doc.text(`${label} :`, 14, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, 100, y);
    doc.setFont("helvetica", "normal");
    y += 7;
  });

  // Confidentiality footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Ce document est strictement confidentiel et destiné exclusivement au destinataire indiqué.",
    14,
    280
  );

  doc.save(`rapport-lp-${params.lpName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
