"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { reportDateSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";

function ReportDateFilterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    {
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
    },
    reportDateSchema
  );

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;
    const params = new URLSearchParams();
    if (data.from) params.set("from", data.from);
    if (data.to) params.set("to", data.to);
    router.push(`/dashboard/reports?${params.toString()}`);
  }

  return (
    <form
      onSubmit={apply}
      noValidate
      className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4"
    >
      <FormField label="From" htmlFor="from" required error={fe("from")}>
        <FormInput
          id="from"
          name="from"
          type="date"
          value={form.from}
          error={fe("from")}
          onChange={(e) => setField("from", e.target.value)}
        />
      </FormField>
      <FormField label="To" htmlFor="to" required error={fe("to")}>
        <FormInput
          id="to"
          name="to"
          type="date"
          value={form.to}
          error={fe("to")}
          onChange={(e) => setField("to", e.target.value)}
        />
      </FormField>
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
