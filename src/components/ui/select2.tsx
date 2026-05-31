"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Select2Option = {
  value: string;
  label: string;
};

type Select2Props = {
  options: Select2Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  emptyMessage?: string;
};

export function Select2({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  searchable = true,
  disabled,
  error,
  className,
  emptyMessage = "No results found",
}: Select2Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          error && "border-destructive ring-3 ring-destructive/20",
          className
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--anchor-width)] min-w-[12rem] p-0"
        align="start"
        sideOffset={4}
      >
        {searchable ? (
          <div className="flex items-center gap-2 border-b px-2 py-1.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
        ) : null}
        <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => pick(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === opt.value && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

type Select2MultiProps = {
  options: Select2Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  emptyMessage?: string;
};

export function Select2Multi({
  options,
  value,
  onChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  searchable = true,
  disabled,
  error,
  className,
  emptyMessage = "No results found",
}: Select2MultiProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const triggerLabel = useMemo(() => {
    if (value.length === 0) return null;
    const labels = value
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .filter(Boolean);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.length} features selected`;
  }, [value, options]);

  function toggle(optValue: string) {
    if (selectedSet.has(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  function clearAll(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex min-h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          error && "border-destructive ring-3 ring-destructive/20",
          className
        )}
      >
        <span
          className={cn(
            "line-clamp-2 text-left",
            !triggerLabel && "text-muted-foreground"
          )}
        >
          {triggerLabel ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--anchor-width)] min-w-[14rem] p-0"
        align="start"
        sideOffset={4}
      >
        {searchable ? (
          <div className="flex items-center gap-2 border-b px-2 py-1.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>
        ) : null}
        {value.length > 0 ? (
          <div className="flex items-center justify-between border-b px-2 py-1.5">
            <span className="text-xs text-muted-foreground">
              {value.length} selected
            </span>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
        ) : null}
        <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((opt) => {
              const checked = selectedSet.has(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      checked && "bg-accent/60"
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        checked ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
