"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";

type Category = {
  id: string;
  name: string;
  deletedAt?: string | null;
  _count?: { expenses: number };
};

export function ExpenseCategoryManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  async function load(archived = showArchived) {
    const q = archived ? "?show=all" : "";
    const res = await fetch(`/api/expense-categories${q}`);
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => {
    load(showArchived);
  }, [showArchived]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName("");
      notify.success("Category created");
      load();
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/expense-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingId(null);
      notify.success("Category updated");
      load();
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, catName: string) {
    const ok = await confirmDelete(`Archive category "${catName}"?`);
    if (!ok) return;
    const res = await fetch(`/api/expense-categories/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      notify.error(data.error || "Cannot archive");
      return;
    }
    notify.success("Category archived");
    load();
    router.refresh();
  }

  async function restoreCategory(id: string) {
    const res = await fetch(`/api/expense-categories/${id}/restore`, {
      method: "POST",
    });
    if (!res.ok) {
      notify.error("Restore failed");
      return;
    }
    notify.success("Category restored");
    load();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <div className="flex-1">
            <FormInput
              id="cat-name"
              placeholder="New category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-auto">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-archived-categories"
            checked={showArchived}
            onCheckedChange={(c) => setShowArchived(c === true)}
          />
          <Label htmlFor="show-archived-categories">Show archived categories</Label>
        </div>
        <ul className="space-y-2">
          {(showArchived
            ? categories.filter((c) => c.deletedAt)
            : categories.filter((c) => !c.deletedAt)
          ).length === 0 ? (
            <li className="text-sm text-muted-foreground py-2">
              {showArchived ? "No archived categories." : "No categories yet."}
            </li>
          ) : null}
          {(showArchived
            ? categories.filter((c) => c.deletedAt)
            : categories.filter((c) => !c.deletedAt)
          ).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              {editingId === c.id ? (
                <div className="flex flex-1 gap-2">
                  <FormInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(c.id)}
                    disabled={loading}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : c.deletedAt ? (
                <>
                  <span className="font-medium text-muted-foreground">{c.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreCategory(c.id)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-medium">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {c._count?.expenses ?? 0} expenses
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id, c.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
