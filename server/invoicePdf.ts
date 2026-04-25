import PDFDocument from "pdfkit";
import * as db from "./db";

interface InvoicePdfData {
  invoice: {
    id: number;
    invoiceNumber: string;
    periodStart: number;
    periodEnd: number;
    rentCredits: string;
    serviceChargeCredits: string;
    totalCredits: string;
    status: string;
    dueDate: number;
    paidDate: number | null;
    notes: string | null;
    createdAt: Date;
  };
  contract: {
    contractNumber: string;
    monthlyRentCredits: string;
    monthlyServiceCharge: string;
    periodType: string;
    indexationMethod: string | null;
    indexationPct: string | null;
  };
  resource: {
    name: string;
    areaM2: string | null;
    floor: string | null;
  };
  location: {
    name: string;
    address: string;
    city: string;
    postalCode: string | null;
  };
  company: {
    name: string;
  } | null;
  tenant: {
    name: string | null;
    email: string;
  } | null;
}

const NL = "nl-NL";
const formatDate = (ts: number) => new Date(ts).toLocaleDateString(NL, { day: "2-digit", month: "long", year: "numeric" });
const formatCurrency = (v: string | number) => `€ ${parseFloat(String(v)).toLocaleString(NL, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCredits = (v: string | number) => `${parseFloat(String(v)).toLocaleString(NL, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} credits`;

// The Green brand colors
const BRAND = {
  black: "#1a1a1a",
  sand: "#c4a97d",
  warmWhite: "#f5f0e8",
  gray: "#6b7280",
  lightGray: "#e5e7eb",
};

export async function generateInvoicePdf(invoiceId: number): Promise<Buffer> {
  const invoice = await db.getRozInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found");

  const contract = await db.getRozContractById(invoice.contractId);
  if (!contract) throw new Error("Contract not found");

  const resource = await db.getResourceById(contract.resourceId);
  const location = await db.getLocationById(contract.locationId);
  const company = contract.companyId ? await db.getCompanyById(contract.companyId) : null;
  const tenant = contract.userId ? await db.getUserById(contract.userId) : null;

  const data: InvoicePdfData = {
    invoice: invoice as any,
    contract: contract as any,
    resource: resource as any,
    location: location as any,
    company: company as any,
    tenant: tenant as any,
  };

  return buildPdf(data);
}

function buildPdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Factuur ${data.invoice.invoiceNumber}`,
        Author: "The Green Boutique Offices",
        Subject: "ROZ Huurovereenkomst Factuur",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = 495; // A4 width minus margins
    let y = 50;

    // ─── Header ───
    // Brand bar
    doc.rect(0, 0, 595.28, 8).fill(BRAND.sand);

    // Company name
    doc.fontSize(24).font("Helvetica-Bold").fillColor(BRAND.black);
    doc.text("THE GREEN", 50, 30);
    doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray);
    doc.text("Boutique Offices", 50, 56);

    // Invoice label top-right
    doc.fontSize(28).font("Helvetica-Bold").fillColor(BRAND.sand);
    doc.text("FACTUUR", 350, 30, { width: 195, align: "right" });

    y = 85;

    // ─── Invoice metadata ───
    doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray);
    const metaLeft = 350;
    const metaValLeft = 440;

    doc.text("Factuurnummer:", metaLeft, y);
    doc.font("Helvetica-Bold").fillColor(BRAND.black).text(data.invoice.invoiceNumber, metaValLeft, y, { width: 105, align: "right" });

    y += 16;
    doc.font("Helvetica").fillColor(BRAND.gray).text("Factuurdatum:", metaLeft, y);
    doc.fillColor(BRAND.black).text(formatDate(data.invoice.createdAt.getTime()), metaValLeft, y, { width: 105, align: "right" });

    y += 16;
    doc.fillColor(BRAND.gray).text("Vervaldatum:", metaLeft, y);
    doc.fillColor(BRAND.black).text(formatDate(data.invoice.dueDate), metaValLeft, y, { width: 105, align: "right" });

    y += 16;
    doc.fillColor(BRAND.gray).text("Status:", metaLeft, y);
    const statusLabel: Record<string, string> = { draft: "Concept", sent: "Verzonden", paid: "Betaald", overdue: "Achterstallig", cancelled: "Geannuleerd" };
    doc.font("Helvetica-Bold").fillColor(data.invoice.status === "paid" ? "#16a34a" : data.invoice.status === "overdue" ? "#dc2626" : BRAND.black);
    doc.text(statusLabel[data.invoice.status] || data.invoice.status, metaValLeft, y, { width: 105, align: "right" });

    if (data.invoice.paidDate) {
      y += 16;
      doc.font("Helvetica").fillColor(BRAND.gray).text("Betaald op:", metaLeft, y);
      doc.fillColor(BRAND.black).text(formatDate(data.invoice.paidDate), metaValLeft, y, { width: 105, align: "right" });
    }

    // ─── Tenant / Company info (left side) ───
    let leftY = 85;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND.sand).text("FACTUUR AAN", 50, leftY);
    leftY += 16;

    doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND.black);
    if (data.company) {
      doc.text(data.company.name, 50, leftY);
      leftY += 14;
    }
    if (data.tenant) {
      doc.font("Helvetica").text(data.tenant.name || data.tenant.email, 50, leftY);
      leftY += 14;
      if (data.tenant.name) {
        doc.fontSize(9).text(data.tenant.email, 50, leftY);
        leftY += 14;
      }
    }

    // ─── Separator ───
    y = Math.max(y, leftY) + 20;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(BRAND.lightGray).lineWidth(1).stroke();
    y += 15;

    // ─── Contract & Resource info ───
    doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND.sand).text("CONTRACTGEGEVENS", 50, y);
    y += 16;

    const contractInfo = [
      ["Contract", data.contract.contractNumber],
      ["Locatie", `${data.location.name}, ${data.location.city}`],
      ["Adres", `${data.location.address}${data.location.postalCode ? `, ${data.location.postalCode}` : ""}`],
      ["Ruimte", `${data.resource.name}${data.resource.floor ? ` (Verdieping ${data.resource.floor})` : ""}`],
      ...(data.resource.areaM2 ? [["Oppervlakte", `${data.resource.areaM2} m²`]] : []),
      ["Periode", `${formatDate(data.invoice.periodStart)} t/m ${formatDate(data.invoice.periodEnd)}`],
      ["Looptijd", data.contract.periodType.replace("_", " ")],
    ];

    for (const [label, value] of contractInfo) {
      doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray).text(label + ":", 50, y, { width: 100 });
      doc.fillColor(BRAND.black).text(value, 155, y, { width: 390 });
      y += 14;
    }

    y += 10;

    // ─── Line items table ───
    // Table header
    doc.rect(50, y, pageWidth, 24).fill(BRAND.black);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Omschrijving", 58, y + 7, { width: 250 });
    doc.text("Bedrag", 400, y + 7, { width: 140, align: "right" });
    y += 24;

    // Line items
    const items = [
      {
        description: `Huur — ${data.resource.name}`,
        detail: `${formatDate(data.invoice.periodStart)} t/m ${formatDate(data.invoice.periodEnd)}`,
        amount: data.invoice.rentCredits,
      },
    ];

    if (parseFloat(data.invoice.serviceChargeCredits || "0") > 0) {
      items.push({
        description: "Servicekosten",
        detail: "Voorschot servicekosten conform huurovereenkomst",
        amount: data.invoice.serviceChargeCredits,
      });
    }

    const indexAdj = parseFloat((data.invoice as any).indexationAdjustment || "0");
    if (indexAdj > 0) {
      items.push({
        description: `Indexatie (${data.contract.indexationMethod || "CPI"} ${data.contract.indexationPct || "2.50"}%)`,
        detail: "Jaarlijkse huurprijsaanpassing",
        amount: String(indexAdj),
      });
    }

    let altRow = false;
    for (const item of items) {
      if (altRow) {
        doc.rect(50, y, pageWidth, 32).fill("#f9fafb");
      }
      doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND.black);
      doc.text(item.description, 58, y + 5, { width: 330 });
      doc.fontSize(8).font("Helvetica").fillColor(BRAND.gray);
      doc.text(item.detail, 58, y + 18, { width: 330 });
      doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND.black);
      doc.text(formatCredits(item.amount), 400, y + 10, { width: 140, align: "right" });
      y += 32;
      altRow = !altRow;
    }

    // ─── Total ───
    y += 4;
    doc.moveTo(350, y).lineTo(545, y).strokeColor(BRAND.lightGray).lineWidth(1).stroke();
    y += 10;

    doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray).text("Subtotaal:", 350, y);
    doc.font("Helvetica-Bold").fillColor(BRAND.black).text(formatCredits(data.invoice.totalCredits), 440, y, { width: 105, align: "right" });
    y += 16;

    // BTW line (ROZ contracts have VAT)
    const vatRate = 21;
    const totalNum = parseFloat(data.invoice.totalCredits);
    const vatAmount = totalNum * (vatRate / 100);
    doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray).text(`BTW (${vatRate}%):`, 350, y);
    doc.fillColor(BRAND.black).text(formatCredits(vatAmount), 440, y, { width: 105, align: "right" });
    y += 16;

    // Grand total
    doc.rect(350, y - 2, 195, 26).fill(BRAND.sand);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("TOTAAL:", 358, y + 4);
    doc.text(formatCredits(totalNum + vatAmount), 440, y + 4, { width: 97, align: "right" });
    y += 40;

    // ─── Payment info ───
    if (data.invoice.status !== "paid") {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND.sand).text("BETAALINFORMATIE", 50, y);
      y += 16;
      doc.fontSize(9).font("Helvetica").fillColor(BRAND.black);
      doc.text("Betaling geschiedt via het credit-systeem van The Green.", 50, y);
      y += 14;
      doc.text(`Gelieve ${formatCredits(totalNum + vatAmount)} over te maken vóór ${formatDate(data.invoice.dueDate)}.`, 50, y);
      y += 14;
      doc.text("Bij vragen over deze factuur kunt u contact opnemen via het platform.", 50, y);
      y += 30;
    }

    // ─── Notes ───
    if (data.invoice.notes) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND.sand).text("OPMERKINGEN", 50, y);
      y += 16;
      doc.fontSize(9).font("Helvetica").fillColor(BRAND.black).text(data.invoice.notes, 50, y, { width: pageWidth });
      y += 30;
    }

    // ─── Footer ───
    const footerY = 780;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(BRAND.lightGray).lineWidth(0.5).stroke();

    doc.fontSize(8).font("Helvetica").fillColor(BRAND.gray);
    doc.text("The Green Boutique Offices", 50, footerY + 8);
    doc.text("KvK: 12345678 · BTW: NL123456789B01", 50, footerY + 20);
    doc.text("www.thegreen.nl · info@thegreen.nl", 50, footerY + 32);

    doc.text(`Pagina 1 van 1`, 400, footerY + 8, { width: 145, align: "right" });
    doc.text(`Gegenereerd: ${new Date().toLocaleDateString(NL)}`, 400, footerY + 20, { width: 145, align: "right" });

    // Brand bar bottom
    doc.rect(0, 834, 595.28, 8).fill(BRAND.sand);

    doc.end();
  });
}

export async function generateBatchInvoicePdf(invoiceIds: number[]): Promise<Buffer> {
  // For batch, we generate individual PDFs and return the first one
  // In a real implementation, you'd merge PDFs or create a ZIP
  if (invoiceIds.length === 0) throw new Error("No invoice IDs provided");
  if (invoiceIds.length === 1) return generateInvoicePdf(invoiceIds[0]);

  // For multiple invoices, generate a combined PDF
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Batch Facturen (${invoiceIds.length})`,
      Author: "The Green Boutique Offices",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise(async (resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    for (let i = 0; i < invoiceIds.length; i++) {
      if (i > 0) doc.addPage();

      const invoice = await db.getRozInvoiceById(invoiceIds[i]);
      if (!invoice) continue;

      const contract = await db.getRozContractById(invoice.contractId);
      if (!contract) continue;

      const resource = await db.getResourceById(contract.resourceId);
      const location = await db.getLocationById(contract.locationId);
      const company = contract.companyId ? await db.getCompanyById(contract.companyId) : null;

      // Simplified batch page
      doc.rect(0, 0, 595.28, 8).fill(BRAND.sand);
      doc.fontSize(18).font("Helvetica-Bold").fillColor(BRAND.black).text("THE GREEN", 50, 30);
      doc.fontSize(9).font("Helvetica").fillColor(BRAND.gray).text("Boutique Offices", 50, 52);

      doc.fontSize(14).font("Helvetica-Bold").fillColor(BRAND.sand);
      doc.text(`FACTUUR ${(invoice as any).invoiceNumber}`, 50, 80);

      let y = 110;
      doc.fontSize(10).font("Helvetica").fillColor(BRAND.black);
      if (company) doc.text(`Bedrijf: ${company.name}`, 50, y), y += 16;
      if (location) doc.text(`Locatie: ${(location as any).name}, ${(location as any).city}`, 50, y), y += 16;
      if (resource) doc.text(`Ruimte: ${(resource as any).name}`, 50, y), y += 16;
      doc.text(`Periode: ${formatDate((invoice as any).periodStart)} t/m ${formatDate((invoice as any).periodEnd)}`, 50, y), y += 16;
      doc.text(`Huur: ${formatCredits((invoice as any).rentCredits)}`, 50, y), y += 16;
      if (parseFloat((invoice as any).serviceChargeCredits || "0") > 0) {
        doc.text(`Servicekosten: ${formatCredits((invoice as any).serviceChargeCredits)}`, 50, y), y += 16;
      }
      y += 8;
      doc.fontSize(14).font("Helvetica-Bold").fillColor(BRAND.sand);
      doc.text(`Totaal: ${formatCredits((invoice as any).totalCredits)}`, 50, y);

      doc.rect(0, 834, 595.28, 8).fill(BRAND.sand);
    }

    doc.end();
  });
}
