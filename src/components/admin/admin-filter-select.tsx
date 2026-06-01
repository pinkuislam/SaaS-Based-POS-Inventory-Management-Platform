"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminFilterOption = { value: string; label: string };

export function AdminFilterSelect({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: AdminFilterOption[];
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v != null) onValueChange(v);
      }}
    >
      <SelectTrigger className={className ?? "w-[160px]"} aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
