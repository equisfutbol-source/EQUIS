/** EQUIS's own seller/issuer credentials, printed on every generated quote. */
export const ISSUER = {
  companyName: "OMNICONNECT PANAMA S.A",
  ruc: "155767761-2-2025",
  dv: "46",
  email: "equisfutbol@gmail.com",
  phone: "+507 6992-2295",
} as const;

export const QUOTE_VALIDITY_DAYS = 15;

/**
 * Sequential per-year quote number (e.g. "COT-2026-001"), backed by a
 * localStorage counter since there's no backend to issue one from. Only
 * call this client-side, once per quote-generation event.
 */
export function getNextQuoteNumber(): string {
  const year = new Date().getFullYear();
  const key = `equisQuoteCounter-${year}`;
  const current = Number(window.localStorage.getItem(key) ?? "0");
  const next = current + 1;
  window.localStorage.setItem(key, String(next));
  return `COT-${year}-${String(next).padStart(3, "0")}`;
}

export function getQuoteValidUntil(issueDate: Date): Date {
  const validUntil = new Date(issueDate);
  validUntil.setDate(validUntil.getDate() + QUOTE_VALIDITY_DAYS);
  return validUntil;
}

/**
 * Sequential per-year B2C order number (e.g. "EQ-2026-0001"), backed by a
 * localStorage counter since there's no backend to issue one from. Only
 * call this client-side, once per order.
 */
export function getNextOrderNumber(): string {
  const year = new Date().getFullYear();
  const key = `equisOrderCounter-${year}`;
  const current = Number(window.localStorage.getItem(key) ?? "0");
  const next = current + 1;
  window.localStorage.setItem(key, String(next));
  return `EQ-${year}-${String(next).padStart(4, "0")}`;
}
