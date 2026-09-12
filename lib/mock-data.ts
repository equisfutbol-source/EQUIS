export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  /** Products sharing a groupId are color variants of the same item — the PDP's color swatches switch between them. */
  groupId: string;
  colorName: string;
  colorHex: string;
  sizes: string[];
  soldOut?: boolean;
}

/**
 * Ball volume pricing: 5-14 balls drop to $20/ball, 15+ balls drop to
 * $18/ball. Only applies to the "Balones" category — other products keep
 * their listed price regardless of quantity.
 */
export function ballUnitPrice(product: Product, quantity: number): number {
  if (product.category !== "Balones") return product.price;
  if (quantity >= 15) return 18;
  if (quantity >= 5) return 20;
  return product.price;
}

export const PRODUCTS: Product[] = [
  {
    id: "balon-tamano-5",
    sku: "EQ-BAL-005",
    name: "Balón Tamaño 5",
    price: 25.0,
    description:
      "Balón oficial tamaño 5, ideal para partidos y entrenamiento adulto, con costura termosellada y superficie de control mejorado.",
    images: ["/balon-tamano-5.png"],
    category: "Balones",
    groupId: "balon-tamano-5",
    colorName: "Blanco",
    colorHex: "#F5F5F5",
    sizes: ["Único"],
  },
  {
    id: "balon-tamano-4",
    sku: "EQ-BAL-004",
    name: "Balón Tamaño 4",
    price: 25.0,
    description:
      "Balón oficial tamaño 4, ideal para entrenamiento juvenil, con costura termosellada y superficie de control mejorado.",
    images: ["/balon-tamano-4.png"],
    category: "Balones",
    groupId: "balon-tamano-4",
    colorName: "Blanco",
    colorHex: "#F5F5F5",
    sizes: ["Único"],
    soldOut: true,
  },
  {
    id: "balon-tamano-3",
    sku: "EQ-BAL-003",
    name: "Balón Tamaño 3",
    price: 25.0,
    description:
      "Balón oficial tamaño 3, ideal para entrenamiento infantil, con costura termosellada y superficie de control mejorado.",
    images: ["/balon-oro-negro.jpg"],
    category: "Balones",
    groupId: "balon-tamano-3",
    colorName: "Dorado",
    colorHex: "#D4AF37",
    sizes: ["Único"],
  },
  {
    id: "balon-tamano-4-v2",
    sku: "EQ-BAL-004B",
    name: "Balón Tamaño 4 v2",
    price: 25.0,
    description:
      "Balón oficial tamaño 4, edición alterna en rojo y azul, ideal para entrenamiento juvenil, con costura termosellada y superficie de control mejorado.",
    images: ["/balon-rojo-azul.jpg"],
    category: "Balones",
    groupId: "balon-tamano-4-v2",
    colorName: "Rojo y Azul",
    colorHex: "#C0392B",
    sizes: ["Único"],
  },
];
