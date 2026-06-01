"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { notify } from "@/lib/notify";
import { categoryItemSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CatalogItemActions } from "@/components/categories/catalog-item-actions";
import { UNIT_TYPES } from "@/lib/units";
import { unitTypeLabel } from "@/lib/units";

interface CategoryItem {
  id: string;
  name: string;
  code?: string | null;
  shortName?: string | null;
  unitType?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  parentName?: string | null;
}

export function CategoryManager({
  tenantSlug,
  categories,
  brands,
  units,
}: {
  tenantSlug?: string;
  categories: CategoryItem[];
  brands: CategoryItem[];
  units: CategoryItem[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const slug = tenantSlug || session?.user?.tenantSlug || "";
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState("");
  const [unitType, setUnitType] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"category" | "brand" | "unit">(
    "category"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    { name: "", code: "", shortName: "" },
    categoryItemSchema
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          name: data.name.trim(),
          code: activeTab === "category" ? data.code?.trim() || undefined : undefined,
          shortName: data.shortName?.trim() || undefined,
          unitType: activeTab === "unit" && unitType ? unitType : undefined,
          description:
            activeTab === "brand" ? brandDescription.trim() || undefined : undefined,
          parentId: activeTab === "category" && parentId ? parentId : undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Added successfully");
      reset();
      setParentId("");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setLoading(false);
    }
  }

  function filterByStatus(items: CategoryItem[]) {
    if (statusFilter === "all") return items;
    if (statusFilter === "active") {
      return items.filter((i) => i.isActive !== false);
    }
    return items.filter((i) => i.isActive === false);
  }

  function renderTable(
    items: CategoryItem[],
    type: "category" | "brand" | "unit"
  ) {
    const rows = type !== "unit" ? filterByStatus(items) : items;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {type === "category" && <TableHead>Code</TableHead>}
            {type === "category" && <TableHead>Parent</TableHead>}
            {type === "unit" && <TableHead>Short</TableHead>}
            {type === "unit" && <TableHead>Type</TableHead>}
            {type !== "unit" && <TableHead>Status</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={type === "category" ? 5 : type === "unit" ? 5 : 3}
                className="text-center text-muted-foreground"
              >
                No items yet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {type === "category" && slug ? (
                    <Link
                      href={tenantDashboardPath(slug, `/categories/${item.id}`)}
                      className="hover:underline"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </TableCell>
                {type === "category" && (
                  <TableCell>{item.code || "—"}</TableCell>
                )}
                {type === "category" && (
                  <TableCell>{item.parentName || "—"}</TableCell>
                )}
                {type === "unit" && (
                  <TableCell>{item.shortName || "—"}</TableCell>
                )}
                {type === "unit" && (
                  <TableCell>{unitTypeLabel(item.unitType)}</TableCell>
                )}
                {type !== "unit" && (
                  <TableCell>
                    <Badge
                      variant={item.isActive !== false ? "default" : "secondary"}
                    >
                      {item.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <CatalogItemActions
                    id={item.id}
                    type={type}
                    name={item.name}
                    code={item.code}
                    shortName={item.shortName}
                    isActive={item.isActive}
                    parentId={type === "category" ? item.parentId : undefined}
                    parentOptions={
                      type === "category"
                        ? categories
                            .filter((c) => c.id !== item.id)
                            .map((c) => ({ value: c.id, label: c.name }))
                        : undefined
                    }
                    categoryOptions={
                      type === "category"
                        ? categories
                            .filter((c) => c.id !== item.id)
                            .map((c) => ({ value: c.id, label: c.name }))
                        : undefined
                    }
                    brandOptions={
                      type === "brand"
                        ? brands
                            .filter((b) => b.id !== item.id)
                            .map((b) => ({ value: b.id, label: b.name }))
                        : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => {
        if (v === "category" || v === "brand" || v === "unit") {
          setActiveTab(v);
          reset();
        }
      }}
    >
      <TabsList>
        <TabsTrigger value="category">Categories</TabsTrigger>
        <TabsTrigger value="brand">Brands</TabsTrigger>
        <TabsTrigger value="unit">Units</TabsTrigger>
      </TabsList>

      {(["category", "brand", "unit"] as const).map((tab) => {
        const items =
          tab === "category" ? categories : tab === "brand" ? brands : units;
        const label =
          tab === "category" ? "Category" : tab === "brand" ? "Brand" : "Unit";

        return (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add {label}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleAdd}
                  className="flex flex-wrap gap-3"
                  noValidate
                >
                  <FormField
                    label="Name"
                    htmlFor="itemName"
                    required
                    error={fieldError("name")}
                    className="flex-1 min-w-[200px]"
                  >
                    <FormInput
                      id="itemName"
                      name="itemName"
                      value={values.name}
                      error={fieldError("name")}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder={`${label} name`}
                    />
                  </FormField>
                  {tab === "category" && (
                    <FormField label="Code" htmlFor="code" className="w-28">
                      <FormInput
                        id="code"
                        value={values.code}
                        onChange={(e) => setField("code", e.target.value)}
                        placeholder="CAT-01"
                      />
                    </FormField>
                  )}
                  {tab === "brand" && (
                    <FormField label="Description" htmlFor="brandDesc" className="flex-1 min-w-[200px]">
                      <FormInput
                        id="brandDesc"
                        value={brandDescription}
                        onChange={(e) => setBrandDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </FormField>
                  )}
                  {tab === "unit" && (
                    <FormField label="Unit type" htmlFor="unitType" className="w-40">
                      <FormSelect2
                        value={unitType}
                        onChange={setUnitType}
                        options={[
                          { value: "", label: "Select type" },
                          ...UNIT_TYPES.map((t) => ({
                            value: t.value,
                            label: t.label,
                          })),
                        ]}
                      />
                    </FormField>
                  )}
                  {tab === "unit" && (
                    <FormField
                      label="Short"
                      htmlFor="shortName"
                      error={fieldError("shortName")}
                      className="w-32"
                    >
                      <FormInput
                        id="shortName"
                        name="shortName"
                        value={values.shortName}
                        error={fieldError("shortName")}
                        onChange={(e) => setField("shortName", e.target.value)}
                        placeholder="pc"
                      />
                    </FormField>
                  )}
                  {tab === "category" && categories.length > 0 && (
                    <FormField label="Parent" htmlFor="parentId" className="w-48">
                      <FormSelect2
                        value={parentId}
                        onChange={setParentId}
                        options={[
                          { value: "", label: "None (top level)" },
                          ...categories.map((c) => ({
                            value: c.id,
                            label: c.name,
                          })),
                        ]}
                      />
                    </FormField>
                  )}
                  <div className="flex items-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">
                  {label} List ({items.length})
                </CardTitle>
                {tab !== "unit" && (
                  <FormSelect2
                    value={statusFilter}
                    onChange={(v) =>
                      setStatusFilter(
                        v === "active" || v === "inactive" ? v : "all"
                      )
                    }
                    options={[
                      { value: "all", label: "All status" },
                      { value: "active", label: "Active only" },
                      { value: "inactive", label: "Inactive only" },
                    ]}
                    className="w-40"
                  />
                )}
              </CardHeader>
              <CardContent>{renderTable(items, tab)}</CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
