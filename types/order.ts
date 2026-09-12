export interface OrderLineItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
}

export type OrderPaymentMethod = "yappy" | "card";
export type OrderAccountType = "person" | "business";

export interface Order {
  orderId: string;
  date: string;
  accountType: OrderAccountType;
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  ruc?: string;
  dv?: string;
  paymentMethod: OrderPaymentMethod;
  yappyReference?: string;
  cardLast4?: string;
  items: OrderLineItem[];
  subtotal: number;
  volumeDiscount: number;
  itbms: number;
  total: number;
}
