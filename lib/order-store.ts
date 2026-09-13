import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Postgres-backed order store (Neon, provisioned via Vercel's marketplace
 * integration). Replaces the earlier file-backed JSON store, which was
 * explicitly unsafe for concurrent writes and didn't work at all on
 * serverless (each invocation got its own filesystem).
 */

export type YappyOrderStatus =
  | "PENDING_YAPPY_PAYMENT"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export interface StoredOrderItem {
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface StoredOrder {
  orderId: string;
  transactionId: string;
  status: YappyOrderStatus;
  accountType: "person" | "business";
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  ruc?: string;
  dv?: string;
  items: StoredOrderItem[];
  subtotal: number;
  volumeDiscount: number;
  itbms: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

let cachedSql: NeonQueryFunction<false, false> | null = null;

function sql(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Missing required environment variable: DATABASE_URL");
    cachedSql = neon(url);
  }
  return cachedSql;
}

// Memoized so the table is only created once per warm serverless instance,
// not on every request.
let schemaReady: Promise<unknown> | null = null;

function ensureSchema(): Promise<unknown> {
  if (!schemaReady) {
    const db = sql();
    schemaReady = db`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        status TEXT NOT NULL,
        account_type TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        company_name TEXT,
        ruc TEXT,
        dv TEXT,
        items JSONB NOT NULL,
        subtotal NUMERIC NOT NULL,
        volume_discount NUMERIC NOT NULL,
        itbms NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `.then(() => db`CREATE INDEX IF NOT EXISTS orders_transaction_id_idx ON orders (transaction_id)`);
  }
  return schemaReady;
}

interface OrderRow {
  order_id: string;
  transaction_id: string;
  status: YappyOrderStatus;
  account_type: "person" | "business";
  customer_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  ruc: string | null;
  dv: string | null;
  items: StoredOrderItem[];
  subtotal: string;
  volume_discount: string;
  itbms: string;
  total: string;
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: OrderRow): StoredOrder {
  return {
    orderId: row.order_id,
    transactionId: row.transaction_id,
    status: row.status,
    accountType: row.account_type,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name ?? undefined,
    ruc: row.ruc ?? undefined,
    dv: row.dv ?? undefined,
    items: row.items,
    subtotal: Number(row.subtotal),
    volumeDiscount: Number(row.volume_discount),
    itbms: Number(row.itbms),
    total: Number(row.total),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function saveOrder(order: StoredOrder): Promise<void> {
  await ensureSchema();
  const db = sql();
  await db`
    INSERT INTO orders (
      order_id, transaction_id, status, account_type, customer_name, email, phone,
      company_name, ruc, dv, items, subtotal, volume_discount, itbms, total, created_at, updated_at
    ) VALUES (
      ${order.orderId}, ${order.transactionId}, ${order.status}, ${order.accountType},
      ${order.customerName}, ${order.email}, ${order.phone}, ${order.companyName ?? null},
      ${order.ruc ?? null}, ${order.dv ?? null}, ${JSON.stringify(order.items)}::jsonb,
      ${order.subtotal}, ${order.volumeDiscount}, ${order.itbms}, ${order.total},
      ${order.createdAt}, ${order.updatedAt}
    )
    ON CONFLICT (order_id) DO UPDATE SET
      transaction_id = EXCLUDED.transaction_id,
      status = EXCLUDED.status,
      account_type = EXCLUDED.account_type,
      customer_name = EXCLUDED.customer_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      company_name = EXCLUDED.company_name,
      ruc = EXCLUDED.ruc,
      dv = EXCLUDED.dv,
      items = EXCLUDED.items,
      subtotal = EXCLUDED.subtotal,
      volume_discount = EXCLUDED.volume_discount,
      itbms = EXCLUDED.itbms,
      total = EXCLUDED.total,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function getOrder(orderId: string): Promise<StoredOrder | null> {
  await ensureSchema();
  const db = sql();
  const rows = (await db`SELECT * FROM orders WHERE order_id = ${orderId}`) as unknown as OrderRow[];
  return rows.length > 0 ? rowToOrder(rows[0]) : null;
}

export async function getOrderByTransactionId(transactionId: string): Promise<StoredOrder | null> {
  await ensureSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM orders WHERE transaction_id = ${transactionId} LIMIT 1
  `) as unknown as OrderRow[];
  return rows.length > 0 ? rowToOrder(rows[0]) : null;
}

export async function updateOrderStatus(
  orderId: string,
  status: YappyOrderStatus
): Promise<StoredOrder | null> {
  await ensureSchema();
  const db = sql();
  const rows = (await db`
    UPDATE orders SET status = ${status}, updated_at = ${new Date().toISOString()}
    WHERE order_id = ${orderId}
    RETURNING *
  `) as unknown as OrderRow[];
  return rows.length > 0 ? rowToOrder(rows[0]) : null;
}
