"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [activeTab, setActiveTab] = useState("category");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          name: name.trim(),
          shortName: shortName.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Added successfully");
      setName("");
      setShortName("");
      router.refresh();
    } catch {
      toast.error("Failed to add");
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
          setName("");
          setShortName("");
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
                <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={`${label} name`}
                      required
                    />
                  </div>
                  {tab === "unit" && (
                    <div className="space-y-2 w-32">
                      <Label>Short</Label>
                      <Input
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value)}
                        placeholder="pc"
                      />
                    </div>
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
              <CardContent>
                {renderTable(items, tab === "unit")}
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
