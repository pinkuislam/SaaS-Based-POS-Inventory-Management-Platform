"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { customerGroupSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
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
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    { name: "" },
    customerGroupSchema
  );

  async function load() {
    const res = await fetch("/api/customer-groups");
    if (res.ok) setGroups(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/customer-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          discountPercent: parseFloat(discount) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Group created");
      reset();
      setDiscount("0");
      load();
      router.refresh();
    } catch {
      notify.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirmDelete(
      "Delete customer group?",
      "Customers in this group will be unassigned."
    );
    if (!confirmed) return;
    const res = await fetch(`/api/customer-groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      notify.success("Group deleted");
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
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap gap-2 items-end"
          noValidate
        >
          <FormField
            label="Group name"
            htmlFor="groupName"
            required
            error={fieldError("name")}
            className="flex-1 min-w-[120px]"
          >
            <FormInput
              id="groupName"
              name="groupName"
              value={values.name}
              error={fieldError("name")}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Wholesale VIP"
            />
          </FormField>
          <FormField
            label="Discount %"
            htmlFor="discount"
            className="w-24"
          >
            <FormInput
              id="discount"
              name="discount"
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </FormField>
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
