"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { usePosStore } from "@/stores/pos-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
} from "lucide-react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";

interface ProductResult {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: unknown;
  stockQty: unknown;
  taxRate: unknown;
}

export function PosScreen() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const {
    items,
    customerId,
    customerName,
    invoiceDiscount,
    paymentMethod,
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    setInvoiceDiscount,
    setPaymentMethod,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
  } = usePosStore();

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setProducts(data);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  function handleAddProduct(product: ProductResult) {
    const stock = decimalToNumber(product.stockQty);
    if (stock <= 0) {
      toast.error("Product out of stock");
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      unitPrice: decimalToNumber(product.sellingPrice),
      taxRate: decimalToNumber(product.taxRate),
      stockQty: stock,
    });
    setSearch("");
    setProducts([]);
    toast.success(`${product.name} added`);
  }

  async function handleCheckout() {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);
    const subtotal = getSubtotal();
    const tax = getTax();
    const total = getTotal();

    const saleItems = items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity - item.discount;
      const lineTax = (lineSubtotal * item.taxRate) / 100;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: lineTax,
        total: lineSubtotal + lineTax,
      };
    });

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: saleItems,
          customerId,
          subtotal,
          discount: invoiceDiscount,
          tax,
          total,
          paidAmount: total,
          paymentMethod,
        }),
      });

      if (!res.ok) throw new Error("Sale failed");

      const sale = await res.json();
      toast.success(`Sale completed! Invoice: ${sale.invoiceNo}`);
      clearCart();
    } catch {
      toast.error("Failed to complete sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or scan barcode..."
                className="pl-10 text-lg h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {searching && (
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            )}
            {products.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                    onClick={() => handleAddProduct(p)}
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.sku} {p.barcode && `| ${p.barcode}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(decimalToNumber(p.sellingPrice))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {decimalToNumber(p.stockQty)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-base">
              Cart ({items.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[400px] p-0">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Scan or search products to add to cart
              </p>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold w-24 text-right">
                      {formatCurrency(
                        item.unitPrice * item.quantity - item.discount
                      )}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer</label>
            <Select
              value={customerId || "walkin"}
              onValueChange={(v) => {
                if (v === "walkin") {
                  setCustomer(null, "Walk-in Customer");
                } else {
                  const c = customers.find((c) => c.id === v);
                  setCustomer(v, c?.name || "");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walkin">Walk-in Customer</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "cash", icon: Banknote, label: "Cash" },
                { value: "card", icon: CreditCard, label: "Card" },
                { value: "mobile", icon: Smartphone, label: "Mobile" },
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={paymentMethod === value ? "default" : "outline"}
                  className="flex flex-col h-auto py-3 gap-1"
                  onClick={() => setPaymentMethod(value)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(getTax())}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground">Discount</span>
              <Input
                type="number"
                className="w-24 h-8 text-right"
                value={invoiceDiscount || ""}
                onChange={(e) =>
                  setInvoiceDiscount(parseFloat(e.target.value) || 0)
                }
                min={0}
              />
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(getTotal())}</span>
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <Button
              className="w-full h-12 text-lg"
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
            >
              {loading ? "Processing..." : `Pay ${formatCurrency(getTotal())}`}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={clearCart}
              disabled={items.length === 0}
            >
              Clear Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
