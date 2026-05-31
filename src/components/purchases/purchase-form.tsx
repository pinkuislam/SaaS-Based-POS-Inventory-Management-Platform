"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePurchaseStore } from "@/stores/purchase-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Minus, Trash2 } from "lucide-react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";

interface ProductResult {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: unknown;
  stockQty: unknown;
}

export function PurchaseForm() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    items,
    supplierId,
    discount,
    tax,
    paidAmount,
    notes,
    addItem,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    setSupplier,
    setDiscount,
    setTax,
    setPaidAmount,
    setNotes,
    clear,
    getSubtotal,
    getTotal,
  } = usePurchaseStore();

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      return;
    }
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
    setProducts(await res.json());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(t);
  }, [search, searchProducts]);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {});
  }, []);

  function handleAdd(product: ProductResult) {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: decimalToNumber(product.purchasePrice) || 0,
    });
    setSearch("");
    setProducts([]);
  }

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    const subtotal = getSubtotal();
    const total = getTotal();
    setLoading(true);

    const purchaseItems = items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: 0,
        total: lineTotal,
      };
    });

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: purchaseItems,
          supplierId,
          subtotal,
          discount,
          tax,
          total,
          paidAmount: paidAmount || total,
          notes,
        }),
      });
      if (!res.ok) throw new Error();
      const purchase = await res.json();
      toast.success(`Purchase saved: ${purchase.invoiceNo}`);
      clear();
      router.push("/dashboard/purchases");
      router.refresh();
    } catch {
      toast.error("Failed to save purchase");
    } finally {
      setLoading(false);
    }
  }

  const total = getTotal();

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products to add..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {products.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex justify-between p-3 hover:bg-muted text-left"
                    onClick={() => handleAdd(p)}
                  >
                    <span>{p.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Cost: {formatCurrency(decimalToNumber(p.purchasePrice))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Purchase Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Search and add products
              </p>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.productId} className="flex flex-wrap items-center gap-2 p-4">
                    <div className="flex-1 min-w-[120px]">
                      <p className="font-medium">{item.name}</p>
                      <Input
                        type="number"
                        className="h-8 w-24 mt-1"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateUnitPrice(
                            item.productId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground ml-1">/ unit</span>
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
                      <span className="w-8 text-center">{item.quantity}</span>
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
                    <span className="font-medium w-24 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
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

      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={supplierId || "none"}
              onValueChange={(v) => {
                if (v === "none") setSupplier(null, "");
                else {
                  const s = suppliers.find((s) => s.id === v);
                  setSupplier(v, s?.name || "");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Discount</Label>
              <Input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax</Label>
              <Input
                type="number"
                value={tax || ""}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paid Amount</Label>
            <Input
              type="number"
              value={paidAmount || total || ""}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Due</span>
              <span>{formatCurrency(Math.max(0, total - (paidAmount || total)))}</span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
          >
            {loading ? "Saving..." : "Save Purchase"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
