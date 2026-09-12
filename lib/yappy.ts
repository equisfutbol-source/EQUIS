import crypto from "crypto";

/**
 * Yappy Comercial (Banco General) API client — v1.0.0.
 *
 * Three API groups per the official spec:
 *   /v1/session          — auth
 *   /v1/collection-method — dynamic payment link / QR generation
 *   /v1/movement          — transaction lookup / status
 *
 * All three are implemented exactly per the confirmed spec, including the
 * full YappyTransactionStatus enum. (The /v1/movement/history batch-lookup
 * endpoint is documented but not implemented here — nothing in this module
 * currently needs it; add it if a consumer does.)
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Standard Yappy response envelope — every endpoint wraps its payload this way. */
interface YappyEnvelope<T> {
  code: string;
  status?: string;
  message?: string;
  body?: T;
}

const YAPPY_SUCCESS_CODE = "YP-0000";

interface YappyLoginResponseBody {
  token: string;
}

interface CachedToken {
  token: string;
  fetchedAt: number; // epoch ms — Yappy's session tokens don't advertise an expiry, so we
  // conservatively re-authenticate once per calendar day since the signed
  // "code" is itself only valid for the current UTC date.
}

let cachedToken: CachedToken | null = null;

function isSameUtcDay(epochMs: number): boolean {
  const now = new Date();
  const then = new Date(epochMs);
  return (
    now.getUTCFullYear() === then.getUTCFullYear() &&
    now.getUTCMonth() === then.getUTCMonth() &&
    now.getUTCDate() === then.getUTCDate()
  );
}

/**
 * `POST /v1/session/login` — signs `ApiKey + current UTC date (YYYY-MM-DD)`
 * with HMAC-SHA256 using the Secret Key, and exchanges that signature for a
 * session token.
 */
export async function getYappySessionToken(): Promise<string> {
  if (cachedToken && isSameUtcDay(cachedToken.fetchedAt)) {
    return cachedToken.token;
  }

  const apiKey = requireEnv("YAPPY_API_KEY");
  const secretKey = requireEnv("YAPPY_SECRET_KEY");
  const baseUrl = requireEnv("YAPPY_BASE_URL");

  const dateStr = new Date().toISOString().split("T")[0];
  const stringToSign = `${apiKey}${dateStr}`;

  const hashCode = crypto.createHmac("sha256", secretKey).update(stringToSign).digest("hex");

  const response = await fetch(`${baseUrl}/v1/session/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ApiKey: apiKey,
    },
    body: JSON.stringify({ code: hashCode }),
  });

  const data = (await response.json()) as YappyEnvelope<YappyLoginResponseBody>;

  if (data.code === YAPPY_SUCCESS_CODE && data.body?.token) {
    cachedToken = { token: data.body.token, fetchedAt: Date.now() };
    return cachedToken.token;
  }

  throw new Error(`Yappy Auth Failed [${data.code}]: ${data.message ?? "Unknown error"}`);
}

export interface PaymentLinkResult {
  transactionId: string;
  url: string;
  qrCode: string;
  expiresAt: string;
}

export interface GeneratePaymentLinkParams {
  orderId: string;
  total: number;
  subtotal: number;
  taxes: number;
  discount: number;
}

const YAPPY_ORDER_TYPE = "TXN-ECOM";

/**
 * `POST /v1/collection-method` — dynamic payment link/QR generation.
 * Request and response shapes confirmed.
 */
export async function generatePaymentLink(params: GeneratePaymentLinkParams): Promise<PaymentLinkResult> {
  const token = await getYappySessionToken();
  const apiKey = requireEnv("YAPPY_API_KEY");
  const baseUrl = requireEnv("YAPPY_BASE_URL");
  // YAPPY_MERCHANT_ID identifies the account; YAPPY_MERCHANT_ALIAS is the
  // distinct registered collection alias — confirmed, these are not the
  // same value.
  const alias = requireEnv("YAPPY_MERCHANT_ALIAS");
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");

  const response = await fetch(`${baseUrl}/v1/collection-method`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ApiKey: apiKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      total: params.total,
      subtotal: params.subtotal,
      taxes: params.taxes,
      discount: params.discount,
      orderId: params.orderId,
      type: YAPPY_ORDER_TYPE,
      alias,
      // NOTE: /checkout/failed does not exist as a page in this app yet.
      successUrl: `${siteUrl}/checkout/success?orderId=${params.orderId}`,
      failUrl: `${siteUrl}/checkout/failed?orderId=${params.orderId}`,
    }),
  });

  const data = (await response.json()) as YappyEnvelope<PaymentLinkResult>;

  if (data.code === YAPPY_SUCCESS_CODE && data.body) {
    return data.body;
  }

  throw new Error(`Yappy payment link creation failed [${data.code}]: ${data.message ?? "Unknown error"}`);
}

export type YappyTransactionStatus =
  | "COMPLETED"
  | "PENDING"
  | "DECLINED"
  | "EXPIRED"
  | "REVERSED"
  | "FAILED";

export interface YappyCustomerInfo {
  phone: string;
  name: string;
}

export interface TransactionStatusResult {
  transactionId: string;
  orderId: string;
  amount: number;
  status: YappyTransactionStatus;
  type: string;
  paymentDate: string;
  customer: YappyCustomerInfo;
}

/**
 * `GET /v1/movement/{transaction-id}` — single transaction status lookup.
 * Request and response shapes confirmed, including the full set of status
 * values a transaction can report.
 */
export async function checkTransactionStatus(transactionId: string): Promise<TransactionStatusResult> {
  const token = await getYappySessionToken();
  const apiKey = requireEnv("YAPPY_API_KEY");
  const baseUrl = requireEnv("YAPPY_BASE_URL");

  const response = await fetch(`${baseUrl}/v1/movement/${transactionId}`, {
    method: "GET",
    headers: {
      ApiKey: apiKey,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as YappyEnvelope<TransactionStatusResult>;

  if (data.code === YAPPY_SUCCESS_CODE && data.body) {
    return data.body;
  }

  throw new Error(`Yappy transaction status check failed [${data.code}]: ${data.message ?? "Unknown error"}`);
}

/**
 * ---------------------------------------------------------------------
 * Yappy V2 — "Botón de Pago" web-component flow.
 * ---------------------------------------------------------------------
 * A separate integration path from the V1 group above: no ApiKey/HMAC
 * signing at all, just merchantId + domain validation per request. Used
 * for app/api/checkout/yappy/route.ts (order creation for checkout).
 *
 * NOTE: this does NOT share auth with the V1 functions above — V1's
 * cachedToken/getYappySessionToken() play no part here. If V1 and V2 turn
 * out to be genuinely separate systems (different base paths under the
 * same host, or different hosts entirely per environment), the V1
 * functions may stop working once YAPPY_BASE_URL points at the V2 sandbox
 * host — see the checkTransactionStatus() caveat this creates for the
 * webhook route.
 */

interface ValidateMerchantResponseBody {
  token: string;
}

/**
 * `POST /payments/validate/merchant` — validates the merchant + site
 * domain and returns a short-lived token used to authorize the following
 * order-creation call. Not cached: fetched fresh for every order, per spec.
 */
export async function validateMerchant(): Promise<string> {
  const baseUrl = requireEnv("YAPPY_BASE_URL");
  const merchantId = requireEnv("YAPPY_MERCHANT_ID");
  const urlDomain = requireEnv("NEXT_PUBLIC_SITE_URL");

  const response = await fetch(`${baseUrl}/payments/validate/merchant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId, urlDomain }),
  });

  if (!response.ok) {
    throw new Error(`Yappy merchant validation failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { body?: ValidateMerchantResponseBody };
  if (!data.body?.token) {
    throw new Error("Yappy merchant validation succeeded but no token was returned.");
  }
  return data.body.token;
}

export interface CreatePaymentOrderParams {
  /** Alphanumeric, max 15 characters — sanitized internally to satisfy that limit. */
  orderId: string;
  /** Panamanian phone number the customer pays from, WITHOUT the +507 prefix. */
  aliasYappy: string;
  subtotal: string;
  total: string;
  taxes?: string;
  discount?: string;
}

export interface CreatePaymentOrderResult {
  transactionId: string;
  token: string;
  documentName: string;
}

interface CreatePaymentOrderResponseBody {
  transactionId: string;
  token: string;
  documentName: string;
}

/**
 * orderId must be alphanumeric and at most 15 characters per the V2 spec
 * (Yappy rejects longer/invalid ids with error E009). Strips non-alphanumeric
 * characters (e.g. the dashes in "EQ-2026-0001") and throws — rather than
 * silently truncating — if what's left still exceeds 15 characters, since a
 * silent truncation risks two different orders colliding on the same id.
 */
function sanitizeOrderIdForYappy(orderId: string): string {
  const sanitized = orderId.replace(/[^a-zA-Z0-9]/g, "");
  if (sanitized.length === 0 || sanitized.length > 15) {
    throw new Error(
      `Invalid Yappy orderId "${orderId}": sanitized value "${sanitized}" must be 1-15 alphanumeric characters (Yappy error E009).`
    );
  }
  return sanitized;
}

/**
 * `POST /payments/payment-wc` — creates the order Yappy's web component
 * renders as a payment button/QR. Returns the fields the frontend widget
 * needs (transactionId, token, documentName).
 */
export async function createPaymentOrder(
  params: CreatePaymentOrderParams
): Promise<CreatePaymentOrderResult> {
  const merchantToken = await validateMerchant();
  const baseUrl = requireEnv("YAPPY_BASE_URL");
  const merchantId = requireEnv("YAPPY_MERCHANT_ID");
  const domain = requireEnv("NEXT_PUBLIC_SITE_URL");

  const response = await fetch(`${baseUrl}/payments/payment-wc`, {
    method: "POST",
    headers: {
      Authorization: merchantToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchantId,
      orderId: sanitizeOrderIdForYappy(params.orderId),
      domain,
      paymentDate: Math.floor(Date.now() / 1000),
      aliasYappy: params.aliasYappy,
      ipnUrl: `${domain}/api/webhooks/yappy`,
      discount: params.discount ?? "0.00",
      taxes: params.taxes ?? "0.00",
      subtotal: params.subtotal,
      total: params.total,
    }),
  });

  if (!response.ok) {
    throw new Error(`Yappy order creation failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { body?: CreatePaymentOrderResponseBody };
  if (!data.body?.transactionId || !data.body?.token || !data.body?.documentName) {
    throw new Error("Yappy order creation succeeded but the response was missing expected fields.");
  }
  return data.body;
}
