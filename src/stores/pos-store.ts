import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
  taxRate: number;
  stockQty: number;
}

interface PosState {
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  invoiceDiscount: number;
  paymentMethod: string;
  notes: string;
  addItem: (item: Omit<CartItem, "quantity" | "discount">) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  removeItem: (productId: string) => void;
  setCustomer: (id: string | null, name: string) => void;
  setInvoiceDiscount: (discount: number) => void;
  setPaymentMethod: (method: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  loadHeldSale: (payload: {
    customerId: string | null;
    customerName: string;
    invoiceDiscount: number;
    items: CartItem[];
  }) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: "Walk-in Customer",
  invoiceDiscount: 0,
  paymentMethod: "cash",
  notes: "",

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({
        items: [...items, { ...item, quantity: 1, discount: 0 }],
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

  updateDiscount: (productId, discount) => {
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, discount } : i
      ),
    });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setInvoiceDiscount: (discount) => set({ invoiceDiscount: discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      customerId: null,
      customerName: "Walk-in Customer",
      invoiceDiscount: 0,
      notes: "",
    }),

  loadHeldSale: (payload) =>
    set({
      items: payload.items,
      customerId: payload.customerId,
      customerName: payload.customerName,
      invoiceDiscount: payload.invoiceDiscount,
    }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discount;
      return sum + lineTotal;
    }, 0);
  },

  getTax: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discount;
      return sum + (lineTotal * item.taxRate) / 100;
    }, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax();
    return subtotal + tax - get().invoiceDiscount;
  },
}));
