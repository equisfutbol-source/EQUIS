import { ISSUER } from "@/lib/company";
import { ITBMS_RATE } from "@/types/quote";
import type { Order } from "@/types/order";

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const styles = {
  page: { backgroundColor: "#f4f4f5", padding: "32px 16px", fontFamily: "Helvetica, Arial, sans-serif" },
  container: { maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff" },
  header: { backgroundColor: "#000000", padding: "28px 32px" },
  headerText: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900 as const,
    letterSpacing: 4,
    color: "#ffffff",
    textTransform: "uppercase" as const,
  },
  body: { padding: "32px" },
  eyebrow: {
    margin: "0 0 4px",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: "#71717a",
  },
  h1: { margin: "0 0 24px", fontSize: 22, fontWeight: 900 as const, color: "#000000" },
  sellerBox: {
    border: "1px solid #e4e4e7",
    backgroundColor: "#fafafa",
    padding: "16px",
    marginBottom: 24,
    fontSize: 12,
    color: "#3f3f46",
    lineHeight: 1.6,
  },
  metaTable: { width: "100%", borderCollapse: "collapse" as const, marginBottom: 24, fontSize: 13 },
  metaLabel: { padding: "4px 0", color: "#71717a", width: "40%" },
  metaValue: { padding: "4px 0", color: "#000000", fontWeight: 700 as const, textAlign: "right" as const },
  itemsTable: { width: "100%", borderCollapse: "collapse" as const, marginBottom: 24 },
  itemsHeadCell: {
    borderBottom: "2px solid #000000",
    padding: "8px 4px",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: "#71717a",
    textAlign: "left" as const,
  },
  itemsHeadCellRight: {
    borderBottom: "2px solid #000000",
    padding: "8px 4px",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: "#71717a",
    textAlign: "right" as const,
  },
  itemCell: { borderBottom: "1px solid #e4e4e7", padding: "10px 4px", fontSize: 13, color: "#000000" },
  itemCellRight: {
    borderBottom: "1px solid #e4e4e7",
    padding: "10px 4px",
    fontSize: 13,
    color: "#000000",
    textAlign: "right" as const,
  },
  totalsTable: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  totalsLabel: { padding: "3px 4px", color: "#3f3f46", textAlign: "right" as const },
  totalsValue: { padding: "3px 4px", color: "#000000", textAlign: "right" as const, width: 100 },
  totalRowLabel: {
    padding: "10px 4px 0",
    color: "#000000",
    fontWeight: 900 as const,
    fontSize: 16,
    textAlign: "right" as const,
    borderTop: "2px solid #000000",
  },
  totalRowValue: {
    padding: "10px 4px 0",
    color: "#000000",
    fontWeight: 900 as const,
    fontSize: 16,
    textAlign: "right" as const,
    width: 100,
    borderTop: "2px solid #000000",
  },
  footer: { padding: "20px 32px", fontSize: 11, color: "#a1a1aa", textAlign: "center" as const },
};

function paymentSummary(order: Order): string {
  if (order.paymentMethod === "yappy") {
    return `YAPPY — Referencia: ${order.yappyReference ?? "—"}`;
  }
  return `Tarjeta terminada en ${order.cardLast4 ?? "----"}`;
}

export function OrderReceiptEmail({ order }: { order: Order }) {
  const orderDate = new Date(order.date).toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={styles.page}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={styles.container}>
        <tbody>
          <tr>
            <td style={styles.header}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="EQUIS" width={32} height={32} style={{ display: "block" }} />
            </td>
          </tr>
          <tr>
            <td style={styles.body}>
              <p style={styles.eyebrow}>Recibo de Compra</p>
              <h1 style={styles.h1}>Gracias por tu pedido</h1>

              <div style={styles.sellerBox}>
                <strong style={{ color: "#000000" }}>{ISSUER.companyName}</strong>
                <br />
                RUC: {ISSUER.ruc} · DV: {ISSUER.dv}
                <br />
                {ISSUER.email} · {ISSUER.phone}
              </div>

              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={styles.metaTable}>
                <tbody>
                  <tr>
                    <td style={styles.metaLabel}>Número de Pedido</td>
                    <td style={styles.metaValue}>{order.orderId}</td>
                  </tr>
                  <tr>
                    <td style={styles.metaLabel}>Fecha</td>
                    <td style={styles.metaValue}>{orderDate}</td>
                  </tr>
                  <tr>
                    <td style={styles.metaLabel}>Cliente</td>
                    <td style={styles.metaValue}>{order.customerName}</td>
                  </tr>
                  {order.accountType === "business" && order.companyName && (
                    <tr>
                      <td style={styles.metaLabel}>Razón Social</td>
                      <td style={styles.metaValue}>
                        {order.companyName} (RUC: {order.ruc} DV: {order.dv})
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={styles.metaLabel}>Método de Pago</td>
                    <td style={styles.metaValue}>{paymentSummary(order)}</td>
                  </tr>
                </tbody>
              </table>

              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={styles.itemsHeadCell}>Producto</th>
                    <th style={styles.itemsHeadCellRight}>Cant.</th>
                    <th style={styles.itemsHeadCellRight}>P. Unit.</th>
                    <th style={styles.itemsHeadCellRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.productId}>
                      <td style={styles.itemCell}>{item.name}</td>
                      <td style={styles.itemCellRight}>{item.quantity}</td>
                      <td style={styles.itemCellRight}>${currency(item.unitPrice)}</td>
                      <td style={styles.itemCellRight}>${currency(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={styles.totalsTable}>
                <tbody>
                  <tr>
                    <td style={styles.totalsLabel}>Subtotal</td>
                    <td style={styles.totalsValue}>${currency(order.subtotal)}</td>
                  </tr>
                  {order.volumeDiscount > 0 && (
                    <tr>
                      <td style={styles.totalsLabel}>Descuento por Volumen</td>
                      <td style={styles.totalsValue}>-${currency(order.volumeDiscount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={styles.totalsLabel}>ITBMS ({Math.round(ITBMS_RATE * 100)}%)</td>
                    <td style={styles.totalsValue}>${currency(order.itbms)}</td>
                  </tr>
                  <tr>
                    <td style={styles.totalRowLabel}>Total USD</td>
                    <td style={styles.totalRowValue}>${currency(order.total)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={styles.footer}>
              Este recibo fue generado automáticamente por EQUIS. Para dudas, escríbenos a{" "}
              {ISSUER.email} o al {ISSUER.phone}.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
