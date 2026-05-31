"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

type Group = {
  id: string;
  name: string;
  discountPercent: unknown;
  _count: { customers: number };
};

export function CustomerGroupsPanel() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/customer-groups");
    if (res.ok) setGroups(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customer-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          discountPercent: parseFloat(discount) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Group created");
      setName("");
      setDiscount("0");
      load();
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this group? Customers will be unassigned.")) return;
    const res = await fetch(`/api/customer-groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Group deleted");
      load();
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customer Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1 flex-1 min-w-[120px]">
            <Label className="text-xs">Group name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wholesale VIP"
              required
            />
          </div>
          <div className="space-y-1 w-24">
            <Label className="text-xs">Discount %</Label>
            <Input
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No groups yet.</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
              >
                <span>
                  {g.name}{" "}
                  <Badge variant="secondary" className="ml-1">
                    {Number(g.discountPercent)}% off
                  </Badge>
                  <span className="text-muted-foreground ml-2">
                    ({g._count.customers} customers)
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(g.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
