"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { saleExchangeSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeftRight } from "lucide-react";
import { decimalToNumber } from "@/lib/utils";

interface SaleItemRow {
  id: string;
  quantity: unknown;
  returnedQty: unknown;
  product: { id: string; name: string; sellingPrice: unknown };
}

export function SaleExchangeDialog({
  saleId,
  invoiceNo,
  items,
  status,
}: {
  saleId: string;
  invoiceNo: string;
  items: SaleItemRow[];
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; sellingPrice: unknown; stockQty: unknown }[]
  >([]);
  const [newItems, setNewItems] = useState<
    { productId: string; name: string; quantity: string; unitPrice: string }[]
  >([]);

  const { values, setField } = useValidatedForm(
    { exchangeReason: "" },
    saleExchangeSchema
  );

  if (status === "RETURNED" || status === "CANCELLED") return null;

  const returnable = items.map((item) => {
    const max =
      decimalToNumber(item.quantity) - decimalToNumber(item.returnedQty);
    return { ...item, maxReturn: max };
  });

  async function handleSearch() {
    if (!search.trim()) return;
    const res = await fetch(
      `/api/products/search?q=${encodeURIComponent(search)}`
    );
    const data = await res.json();
    setSearchResults(Array.isArray(data) ? data : []);
  }

  function addNewProduct(p: {
    id: string;
    name: string;
    sellingPrice: unknown;
  }) {
    if (newItems.some((i) => i.productId === p.id)) return;
    setNewItems([
      ...newItems,
      {
        productId: p.id,
        name: p.name,
        quantity: "1",
        unitPrice: String(decimalToNumber(p.sellingPrice)),
      },
    ]);
    setSearch("");
    setSearchResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const returnItems = returnable
      .map((item) => ({
        saleItemId: item.id,
        quantity: parseFloat(returnQtys[item.id] || "0"),
      }))
      .filter((i) => i.quantity > 0);

    const exchangeNewItems = newItems
      .map((i) => ({
        productId: i.productId,
        quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
      }))
      .filter((i) => i.quantity > 0);

    if (returnItems.length === 0 && exchangeNewItems.length === 0) {
      notify.error("Return at least one item or add exchange products");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnItems,
          newItems: exchangeNewItems,
          exchangeReason: values.exchangeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Exchange processed");
      setOpen(false);
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Exchange failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ArrowLeftRight className="h-4 w-4" />
        Exchange
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exchange — {invoiceNo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Reason" htmlFor="exchangeReason">
            <FormInput
              id="exchangeReason"
              name="exchangeReason"
              value={values.exchangeReason}
              onChange={(e) => setField("exchangeReason", e.target.value)}
              placeholder="e.g. Wrong size"
            />
          </FormField>

          <div>
            <span className="text-sm font-medium mb-2 block">
              Return from invoice
            </span>
            <div className="space-y-2">
              {returnable.map((item) =>
                item.maxReturn > 0 ? (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="flex-1 text-sm truncate">
                      {item.product.name} (max {item.maxReturn})
                    </span>
                    <FormInput
                      type="number"
                      min="0"
                      max={item.maxReturn}
                      className="w-20 h-8"
                      value={returnQtys[item.id] || ""}
                      onChange={(e) =>
                        setReturnQtys({
                          ...returnQtys,
                          [item.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium mb-2 block">
              Add exchange products
            </span>
            <div className="flex gap-2">
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleSearch())
                }
              />
              <Button type="button" variant="outline" onClick={handleSearch}>
                Search
              </Button>
            </div>
            {searchResults.length > 0 && (
              <ul className="mt-2 border rounded-md max-h-32 overflow-y-auto text-sm">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted"
                      onClick={() => addNewProduct(p)}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {newItems.map((item, idx) => (
              <div key={item.productId} className="flex gap-2 mt-2 items-center">
                <span className="flex-1 text-sm truncate">{item.name}</span>
                <FormInput
                  type="number"
                  min="1"
                  className="w-16 h-8"
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...newItems];
                    next[idx].quantity = e.target.value;
                    setNewItems(next);
                  }}
                />
                <FormInput
                  type="number"
                  step="0.01"
                  className="w-20 h-8"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const next = [...newItems];
                    next[idx].unitPrice = e.target.value;
                    setNewItems(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setNewItems(newItems.filter((_, i) => i !== idx))
                  }
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Process Exchange"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
