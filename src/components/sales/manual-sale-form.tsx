"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { decimalToNumber } from "@/lib/utils";

type ProductHit = {
  id: string;
  name: string;
  sellingPrice: unknown;
  stockQty: unknown;
};

type CustomerOption = { id: string; name: string };

export function ManualSaleForm({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductHit[]>([]);
  const [lines, setLines] = useState<
    { productId: string; name: string; qty: string; price: string }[]
  >([]);
  const [customerId, setCustomerId] = useState("walk-in");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  async function handleSearch() {
    if (!search.trim()) return;
    const res = await fetch(
      `/api/products/search?q=${encodeURIComponent(search)}`
    );
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
  }

  function addLine(p: ProductHit) {
    if (lines.some((l) => l.productId === p.id)) return;
    setLines([
      ...lines,
      {
        productId: p.id,
        name: p.name,
        qty: "1",
        price: String(decimalToNumber(p.sellingPrice)),
      },
    ]);
    setSearch("");
    setResults([]);
  }

  const subtotal = lines.reduce(
    (s, l) => s + parseFloat(l.qty || "0") * parseFloat(l.price || "0"),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    const items = lines.map((l) => {
      const quantity = parseFloat(l.qty);
      const unitPrice = parseFloat(l.price);
      return {
        productId: l.productId,
        quantity,
        unitPrice,
        discount: 0,
        tax: 0,
        total: quantity * unitPrice,
      };
    });

    const total = subtotal;
    const paid = paidAmount ? parseFloat(paidAmount) : total;

    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerId: customerId === "walk-in" ? null : customerId,
          subtotal: total,
          discount: 0,
          tax: 0,
          total,
          paidAmount: paid,
          paymentMethod,
          notes: notes ? `[Manual] ${notes}` : "[Manual sale]",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Sale ${data.invoiceNo} created`);
      router.push(`/dashboard/sales/${data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, barcode..."
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleSearch())
              }
            />
            <Button type="button" variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>
          {results.length > 0 && (
            <ul className="border rounded-md divide-y max-h-40 overflow-y-auto">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => addLine(p)}
                  >
                    {p.name} — stock {decimalToNumber(p.stockQty)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {lines.map((line, idx) => (
            <div key={line.productId} className="flex gap-2 items-center">
              <span className="flex-1 text-sm font-medium truncate">
                {line.name}
              </span>
              <Input
                type="number"
                min="0.001"
                step="any"
                className="w-20"
                value={line.qty}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx].qty = e.target.value;
                  setLines(next);
                }}
              />
              <Input
                type="number"
                step="0.01"
                className="w-24"
                value={line.price}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx].price = e.target.value;
                  setLines(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines(lines.filter((_, i) => i !== idx))}
              >
                ×
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={customerId}
              onValueChange={(v) => setCustomerId(v ?? "walk-in")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Walk-in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total</Label>
            <Input value={subtotal.toFixed(2)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Paid amount</Label>
            <Input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={subtotal.toFixed(2)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Saving..." : `Complete sale — ৳${subtotal.toFixed(2)}`}
      </Button>
    </form>
  );
}
