"use client";

import { useState, useEffect, useCallback } from "react";
import { notify } from "@/lib/notify";
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
  Pause,
} from "lucide-react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { HeldSalesPanel } from "@/components/pos/held-sales-panel";
import { PosDailySummary } from "@/components/pos/pos-daily-summary";
import { PosQuickProducts, type QuickProduct } from "@/components/pos/pos-quick-products";
import { PosSalesBrowser } from "@/components/pos/pos-sales-browser";

interface ProductResult {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: unknown;
  stockQty: unknown;
  reorderLevel?: unknown;
  taxRate: unknown;
}

interface PosCustomer {
  id: string;
  name: string;
  totalDue: number;
}

export function PosScreen() {
  const { data: session } = useSession();
  const tenantSlug = session?.user?.tenantSlug || "demo-shop";
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [selectedCustomerDue, setSelectedCustomerDue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [splitMode, setSplitMode] = useState(false);
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");
  const [splitMobile, setSplitMobile] = useState("");
  const [heldKey, setHeldKey] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  const {
    items,
    customerId,
    customerName,
    invoiceDiscount,
    paymentMethod,
    addItem,
    updateQuantity,
    updateDiscount,
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
  }, [categoryId]);

  useEffect(() => {
    fetch("/api/categories?type=category")
      .then((r) => r.json())
      .then((data) =>
        setCategories(
          Array.isArray(data)
            ? data.filter((c: { isActive?: boolean }) => c.isActive !== false)
            : []
        )
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  useEffect(() => {
    if (categoryId) void searchProducts(search);
  }, [categoryId, searchProducts, search]);

  useEffect(() => {
    fetch("/api/pos/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!customerId) {
      setSelectedCustomerDue(0);
      return;
    }
    const c = customers.find((x) => x.id === customerId);
    setSelectedCustomerDue(c?.totalDue ?? 0);
  }, [customerId, customers]);

  async function resolveBarcodeAdd(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    const res = await fetch(
      `/api/products/search?q=${encodeURIComponent(trimmed)}`
    );
    const data: ProductResult[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      notify.error("No product found");
      return;
    }
    const exact =
      data.find((p) => p.barcode === trimmed) ||
      (data.length === 1 ? data[0] : null);
    if (exact) {
      handleAddProduct(exact);
    } else {
      setProducts(data);
      notify.info("Multiple matches — select a product");
    }
  }

  function handleAddProduct(
    product: ProductResult | QuickProduct
  ) {
    const stock = decimalToNumber(product.stockQty);
    const reorder = decimalToNumber(product.reorderLevel);
    if (stock <= 0) {
      notify.error("Product out of stock");
      return;
    }
    if (reorder > 0 && stock <= reorder) {
      notify.warning(`Low stock: ${stock} left (reorder at ${reorder})`);
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
    notify.success(`${product.name} added`);
  }

  async function handleHold() {
    if (items.length === 0) {
      notify.error("Cart is empty");
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
      const res = await fetch("/api/sales/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: saleItems,
          customerId,
          subtotal,
          discount: invoiceDiscount,
          tax,
          total,
        }),
      });
      if (!res.ok) throw new Error();
      const sale = await res.json();
      notify.success(`Sale held: ${sale.invoiceNo}`);
      clearCart();
      setHeldKey((k) => k + 1);
    } catch {
      notify.error("Failed to hold sale");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (items.length === 0) {
      notify.error("Cart is empty");
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

    let finalPaid = paidAmount !== "" ? parseFloat(paidAmount) : total;
    let finalMethod = paymentMethod;
    let splitPayments: Record<string, number> | undefined;

    if (splitMode) {
      const cash = parseFloat(splitCash) || 0;
      const card = parseFloat(splitCard) || 0;
      const mobile = parseFloat(splitMobile) || 0;
      finalPaid = cash + card + mobile;
      if (Math.abs(finalPaid - total) > 0.01) {
        notify.error("Split payments must equal total");
        setLoading(false);
        return;
      }
      finalMethod = "split";
      splitPayments = { cash, card, mobile };
    }

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
          paidAmount: finalPaid,
          paymentMethod: finalMethod,
          splitPayments,
        }),
      });

      if (!res.ok) throw new Error("Sale failed");

      const sale = await res.json();
      notify.success(`Sale completed! Invoice: ${sale.invoiceNo}`);
      clearCart();
      window.location.href = tenantDashboardPath(
        tenantSlug,
        `/sales/${sale.id}?print=thermal`
      );
    } catch {
      notify.error("Failed to complete sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PosDailySummary />
      <div className="grid lg:grid-cols-2 gap-4">
        <HeldSalesPanel key={heldKey} onResume={() => setHeldKey((k) => k + 1)} />
        <PosSalesBrowser />
      </div>
      <PosQuickProducts onSelect={handleAddProduct} />
    <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2 flex-wrap">
              <Select
                value={categoryId || "all"}
                onValueChange={(v) => setCategoryId(!v || v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, barcode, or category..."
                className="pl-10 text-lg h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void resolveBarcodeAdd(search);
                  }
                }}
                autoFocus
              />
            </div>
            {searching && (
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            )}
            {products.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                {products.map((p) => {
                  const stock = decimalToNumber(p.stockQty);
                  const reorder = decimalToNumber(p.reorderLevel);
                  const low =
                    stock > 0 && reorder > 0 && stock <= reorder;
                  const out = stock <= 0;
                  return (
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
                    <div className="text-right space-y-1">
                      <p className="font-semibold">
                        {formatCurrency(decimalToNumber(p.sellingPrice))}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-xs text-muted-foreground">
                          Stock: {stock}
                        </p>
                        {out && (
                          <Badge variant="destructive" className="text-[10px] px-1">
                            Out
                          </Badge>
                        )}
                        {low && !out && (
                          <Badge variant="secondary" className="text-[10px] px-1">
                            Low
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                  );
                })}
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
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Disc.
                        </span>
                        <Input
                          type="number"
                          className="h-7 w-16 text-xs"
                          min={0}
                          value={item.discount || ""}
                          onChange={(e) =>
                            updateDiscount(
                              item.productId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
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
            {selectedCustomerDue > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1.5">
                This customer has {formatCurrency(selectedCustomerDue)} outstanding
                from previous sales.
              </p>
            )}
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={splitMode}
              onChange={(e) => setSplitMode(e.target.checked)}
            />
            Split payment
          </label>
          {splitMode && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cash</label>
                <Input
                  type="number"
                  className="h-8"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Card</label>
                <Input
                  type="number"
                  className="h-8"
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Mobile</label>
                <Input
                  type="number"
                  className="h-8"
                  value={splitMobile}
                  onChange={(e) => setSplitMobile(e.target.value)}
                />
              </div>
            </div>
          )}

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
            <div className="flex justify-between items-center gap-2 pt-1">
              <span className="text-muted-foreground">Amount Paid</span>
              <Input
                type="number"
                className="w-28 h-8 text-right"
                placeholder={String(getTotal())}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                min={0}
              />
            </div>
            {paidAmount !== "" && parseFloat(paidAmount) < getTotal() && (
              <div className="flex justify-between text-amber-600 text-sm">
                <span>Due</span>
                <span>
                  {formatCurrency(getTotal() - (parseFloat(paidAmount) || 0))}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <Button
              className="w-full h-12 text-lg"
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
            >
              {loading
                ? "Processing..."
                : paidAmount !== "" && parseFloat(paidAmount) < getTotal()
                  ? `Save Due Sale`
                  : `Pay ${formatCurrency(getTotal())}`}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleHold}
              disabled={loading || items.length === 0}
            >
              <Pause className="h-4 w-4 mr-2" />
              Hold Sale
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
    </div>
  );
}
