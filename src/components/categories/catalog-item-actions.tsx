"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

export function CatalogItemActions({
  id,
  type,
  name: initialName,
  code: initialCode,
  shortName: initialShort,
  isActive: initialActive,
  parentId: initialParentId,
  parentOptions,
  categoryOptions,
  brandOptions,
}: {
  id: string;
  type: "category" | "brand" | "unit";
  name: string;
  code?: string | null;
  shortName?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  parentOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
  brandOptions?: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState(initialCode || "");
  const [description, setDescription] = useState("");
  const [unitType, setUnitType] = useState("");
  const [shortName, setShortName] = useState(initialShort || "");
  const [isActive, setIsActive] = useState(initialActive ?? true);
  const [parentId, setParentId] = useState(initialParentId || "");
  const [moveToCategoryId, setMoveToCategoryId] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}?type=${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: type === "category" ? code.trim() || null : undefined,
          description: type === "brand" ? description.trim() || null : undefined,
          shortName: type === "unit" ? shortName : undefined,
          unitType: type === "unit" ? unitType || null : undefined,
          isActive: type !== "unit" ? isActive : undefined,
          parentId: type === "category" ? parentId || null : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(moveTarget?: string) {
    let url = `/api/categories/${id}?type=${type}`;
    if (moveTarget) {
      if (type === "category") {
        url += `&moveToCategoryId=${moveTarget}`;
      } else if (type === "brand") {
        url += `&moveToBrandId=${moveTarget}`;
      }
    }
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      if (
        type === "category" &&
        data.error?.includes("moveToCategoryId") &&
        categoryOptions?.length
      ) {
        setDeleteOpen(true);
        return;
      }
      if (
        type === "brand" &&
        data.error?.includes("moveToBrandId") &&
        brandOptions?.length
      ) {
        setDeleteOpen(true);
        return;
      }
      notify.error(data.error || "Cannot delete");
      return;
    }
    notify.success("Deleted");
    setDeleteOpen(false);
    router.refresh();
  }

  async function onDeleteClick() {
    const ok = await confirmDelete(`Delete "${initialName}"?`);
    if (!ok) return;
    await handleDelete();
  }

  async function onConfirmMoveDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!moveToCategoryId) {
      notify.error("Select a category to move products to");
      return;
    }
    setLoading(true);
    try {
      await handleDelete(moveToCategoryId);
    } finally {
      setLoading(false);
    }
  }

  const moveCategoryOptions =
    categoryOptions?.filter((c) => c.value !== id) ?? [];
  const moveBrandOptions =
    brandOptions?.filter((b) => b.value !== id) ?? [];

  return (
    <div className="flex justify-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <FormInput
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {type === "brand" && (
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <FormInput
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}
            {type === "category" && (
              <div>
                <Label htmlFor="edit-code">Code</Label>
                <FormInput
                  id="edit-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            )}
            {type === "unit" && (
              <div>
                <Label htmlFor="edit-short">Short name</Label>
                <FormInput
                  id="edit-short"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                />
              </div>
            )}
            {type === "category" && parentOptions && parentOptions.length > 0 && (
              <div>
                <Label htmlFor="edit-parent">Parent category</Label>
                <FormSelect2
                  value={parentId}
                  onChange={setParentId}
                  options={[
                    { value: "", label: "None (top level)" },
                    ...parentOptions,
                  ]}
                />
              </div>
            )}
            {type !== "unit" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-active"
                  checked={isActive}
                  onCheckedChange={(c) => setIsActive(c === true)}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="icon" onClick={onDeleteClick}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      {((type === "category" && moveCategoryOptions.length > 0) ||
        (type === "brand" && moveBrandOptions.length > 0)) && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move products & delete</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Products are assigned. Choose a target to reassign them, then delete.
            </p>
            <form onSubmit={onConfirmMoveDelete} className="space-y-4">
              <div>
                <Label>Move products to</Label>
                <FormSelect2
                  value={moveToCategoryId}
                  onChange={setMoveToCategoryId}
                  options={
                    type === "brand" ? moveBrandOptions : moveCategoryOptions
                  }
                />
              </div>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? "Deleting..." : "Move & delete"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
