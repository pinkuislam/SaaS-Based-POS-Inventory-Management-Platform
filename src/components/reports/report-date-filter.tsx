"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function ReportDateFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const fromVal = fd.get("from") as string;
    const toVal = fd.get("to") as string;
    if (fromVal) params.set("from", fromVal);
    if (toVal) params.set("to", toVal);
    router.push(`/dashboard/reports?${params.toString()}`);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4"
    >
      <div className="space-y-1">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={to} />
      </div>
      <Button type="submit">Apply Filter</Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/dashboard/reports")}
      >
        Reset
      </Button>
    </form>
  );
}

export function ReportDateFilter() {
  return (
    <Suspense fallback={null}>
      <ReportDateFilterInner />
    </Suspense>
  );
}
