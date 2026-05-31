import { create } from "zustand";

export interface PurchaseCartItem {
  productId: string;
  name: string;
  sku?: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
}

interface PurchaseState {
  items: PurchaseCartItem[];
  supplierId: string | null;
  supplierName: string;
  discount: number;
  tax: number;
  paidAmount: number;
  notes: string;
  addItem: (item: Omit<PurchaseCartItem, "quantity" | "discount">) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateUnitPrice: (productId: string, price: number) => void;
  removeItem: (productId: string) => void;
  setSupplier: (id: string | null, name: string) => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setPaidAmount: (amount: number) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  items: [],
  supplierId: null,
  supplierName: "",
  discount: 0,
  tax: 0,
  paidAmount: 0,
  notes: "",

  addItem: (item) => {
    const existing = get().items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({
        items: [...get().items, { ...item, quantity: 1, discount: 0 }],
      });
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    });
  },

  updateUnitPrice: (productId, price) => {
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, unitPrice: price } : i
      ),
    });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  setSupplier: (id, name) => set({ supplierId: id, supplierName: name }),
  setDiscount: (discount) => set({ discount }),
  setTax: (tax) => set({ tax }),
  setPaidAmount: (paidAmount) => set({ paidAmount }),
  setNotes: (notes) => set({ notes }),

  clear: () =>
    set({
      items: [],
      supplierId: null,
      supplierName: "",
      discount: 0,
      tax: 0,
      paidAmount: 0,
      notes: "",
    }),

  getSubtotal: () =>
    get().items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity - i.discount,
      0
    ),

  getTotal: () => get().getSubtotal() - get().discount + get().tax,
}));
