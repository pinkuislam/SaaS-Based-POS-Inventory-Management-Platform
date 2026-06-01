"use client";

import { Loader2 } from "lucide-react";

export function DialogActionOverlay({ loading }: { loading: boolean }) {
  if (!loading) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[1px]"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
