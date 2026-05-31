"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { categoryItemSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Item {
  id: string;
  name: string;
  shortName?: string | null;
}

export function CategoryManager({
  categories,
  brands,
  units,
}: {
  categories: Item[];
  brands: Item[];
  units: Item[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("category");

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    { name: "", shortName: "" },
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
          shortName: data.shortName?.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Added successfully");
      reset();
      router.refresh();
    } catch {
      notify.error("Failed to add");
    } finally {
      setLoading(false);
    }
  }

  function renderTable(items: Item[], showShort = false) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {showShort && <TableHead>Short Name</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              {showShort && <TableCell>{item.shortName || "—"}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => {
        if (v) {
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
                  <div className="flex items-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {label} List ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>{renderTable(items, tab === "unit")}</CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
