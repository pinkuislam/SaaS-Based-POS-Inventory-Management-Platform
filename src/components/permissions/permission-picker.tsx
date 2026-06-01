"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permissions";

export function PermissionPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(perm: Permission) {
    if (disabled) return;
    onChange(
      selected.includes(perm)
        ? selected.filter((p) => p !== perm)
        : [...selected, perm]
    );
  }

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className="space-y-2 rounded-md border p-3">
            {group.permissions.map((perm) => (
              <label
                key={perm}
                className="flex items-center gap-3 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(perm)}
                  disabled={disabled}
                  onCheckedChange={() => toggle(perm)}
                />
                <Label className="cursor-pointer font-normal">
                  {PERMISSION_LABELS[perm]}
                </Label>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
