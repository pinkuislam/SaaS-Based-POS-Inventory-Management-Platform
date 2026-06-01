"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function RoleBranchPicker({
  branches,
  selected,
  onChange,
}: {
  branches: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  if (branches.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No branches available.</p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3 max-h-32 overflow-y-auto">
      <p className="text-xs text-muted-foreground">
        Leave empty for access to all branches
      </p>
      {branches.map((b) => (
        <label key={b.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selected.includes(b.id)}
            onCheckedChange={() => toggle(b.id)}
          />
          <Label className="font-normal cursor-pointer">{b.name}</Label>
        </label>
      ))}
    </div>
  );
}
