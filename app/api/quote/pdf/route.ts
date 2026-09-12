import { NextResponse } from "next/server";
import { ISSUER, getQuoteValidUntil, QUOTE_VALIDITY_DAYS } from "@/lib/company";
import { computeQuoteTotals, discountRateForQuantity, ITBMS_RATE, type QuoteLineItem } from "@/types/quote";

interface QuotePdfRequestItem {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface QuotePdfRequestBody {
  companyName: string;
  ruc: string;
  dv: string;
  contactName: string;
  email: string;
  phone: string;
  items: QuotePdfRequestItem[];
}

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (date: Date) =>
  date.toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric" });

function generateServerQuoteNumber(): string {
  const year = new Date().getFullYear();
  return `COT-${year}-${String(Date.now()).slice(-6)}`;
}

function isValidBody(body: unknown): body is QuotePdfRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.companyName === "string" &&
    b.companyName.trim().length > 0 &&
    typeof b.ruc === "string" &&
    b.ruc.trim().length > 0 &&
    typeof b.dv === "string" &&
    b.dv.trim().length > 0 &&
    typeof b.contactName === "string" &&
    b.contactName.trim().length > 0 &&
    typeof b.email === "string" &&
    b.email.trim().length > 0 &&
    typeof b.phone === "string" &&
    b.phone.trim().length > 0 &&
    Array.isArray(b.items) &&
    b.items.length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Faltan datos requeridos para generar la cotización." }, { status: 400 });
  }

  const { default: jsPDF } = await import("jspdf");

  const lineItems: QuoteLineItem[] = body.items.map((item, index) => ({
    productId: `${item.sku}-${index}`,
    sku: item.sku,
    product_name: item.name,
    unit_price: item.unitPrice,
    quantity: item.quantity,
  }));

  const totals = computeQuoteTotals(lineItems);
  const total = totals.total;
  const quoteNumber = generateServerQuoteNumber();
  const issueDate = new Date();
  const validUntil = getQuoteValidUntil(issueDate);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 48;
  const rightX = 564;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("EQUIS", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  const issuerLines = [ISSUER.companyName, `RUC: ${ISSUER.ruc}  DV: ${ISSUER.dv}`, ISSUER.email, ISSUER.phone];
  let issuerY = y + 16;
  for (const line of issuerLines) {
    doc.text(line, marginX, issuerY);
    issuerY += 12;
  }
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(quoteNumber, rightX, y - 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Fecha de Emisión: ${formatDate(issueDate)}`, rightX, y + 10, { align: "right" });
  doc.text(`Válida hasta: ${formatDate(validUntil)} (${QUOTE_VALIDITY_DAYS} días)`, rightX, y + 22, {
    align: "right",
  });

  y = Math.max(issuerY, y + 34) + 16;
  doc.setDrawColor(220);
  doc.line(marginX, y, rightX, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Datos del Comprador", marginX, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const buyerLines = [
    `Razón Social: ${body.companyName}`,
    `RUC / DV: ${body.ruc} / ${body.dv}`,
    `Persona de Contacto: ${body.contactName}`,
    `Correo: ${body.email}`,
    `Teléfono: ${body.phone}`,
  ];
  for (const line of buyerLines) {
    doc.text(line, marginX, y);
    y += 15;
  }
  y += 12;

  doc.setDrawColor(220);
  doc.line(marginX, y, rightX, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Detalle de Productos", marginX, y);
  y += 20;

  doc.setFontSize(9);
  doc.text("SKU", marginX, y);
  doc.text("Producto", marginX + 70, y);
  doc.text("Cant.", marginX + 300, y);
  doc.text("P. Unit.", marginX + 350, y);
  doc.text("Desc.", marginX + 420, y);
  doc.text("Total", marginX + 470, y);
  y += 6;
  doc.line(marginX, y, rightX, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  for (const item of lineItems) {
    const discountRate = discountRateForQuantity(item.quantity);
    const lineTotal = item.unit_price * item.quantity * (1 - discountRate);
    doc.text(item.sku, marginX, y);
    doc.text(item.product_name.slice(0, 32), marginX + 70, y);
    doc.text(String(item.quantity), marginX + 300, y);
    doc.text(`$${currency(item.unit_price)}`, marginX + 350, y);
    doc.text(discountRate > 0 ? `-${Math.round(discountRate * 100)}%` : "—", marginX + 420, y);
    doc.text(`$${currency(lineTotal)}`, marginX + 470, y);
    y += 16;
  }

  y += 10;
  doc.line(marginX, y, rightX, y);
  y += 20;

  const totalsLines: [string, string][] = [
    ["Subtotal", `$${currency(totals.grossSubtotal)}`],
    ["Descuento por Volumen", `-$${currency(totals.totalDiscount)}`],
    [`ITBMS (${Math.round(ITBMS_RATE * 100)}%)`, `$${currency(totals.itbms)}`],
  ];
  doc.setFontSize(10);
  for (const [label, value] of totalsLines) {
    doc.text(label, marginX + 350, y);
    doc.text(value, marginX + 470, y);
    y += 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total USD", marginX + 350, y + 6);
  doc.text(`$${currency(total)}`, marginX + 470, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(`${quoteNumber} — Generado el ${formatDate(issueDate)} — ${ISSUER.companyName}`, marginX, 750);

  const pdfArrayBuffer = doc.output("arraybuffer") as ArrayBuffer;

  return new NextResponse(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quoteNumber}.pdf"`,
    },
  });
}
