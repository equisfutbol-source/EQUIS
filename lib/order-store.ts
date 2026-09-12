import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Minimal file-backed order store standing in for a real database.
 *
 * A Yappy webhook is a server-to-server call — it has no access to the
 * browser's localStorage the rest of this app uses for order state — so
 * something durable has to hold orders between "checkout created a payment
 * link" and "webhook confirmed it was paid".
 *
 * This is NOT safe for production: concurrent writes can clobber each
 * other, and serverless deployments run each invocation in an isolated
 * instance with its own filesystem, so state written by one request may
 * not be visible to the next. Replace with a real database (Postgres,
 * Supabase, etc.) before going live.
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

const STORE_PATH = path.join(process.cwd(), ".data", "yappy-orders.json");

async function readStore(): Promise<Record<string, StoredOrder>> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, StoredOrder>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, StoredOrder>): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function saveOrder(order: StoredOrder): Promise<void> {
  const store = await readStore();
  store[order.orderId] = order;
  await writeStore(store);
}

export async function getOrder(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  return store[orderId] ?? null;
}

export async function getOrderByTransactionId(transactionId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  return Object.values(store).find((order) => order.transactionId === transactionId) ?? null;
}

export async function updateOrderStatus(
  orderId: string,
  status: YappyOrderStatus
): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store[orderId];
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await writeStore(store);
  return order;
}
