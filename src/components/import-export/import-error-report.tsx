"use client";

import { Button } from "@/components/ui/button";

export function ImportErrorReport({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  function downloadErrors() {
    const blob = new Blob([errors.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <div className="flex justify-between items-center mb-2">
        <p className="font-medium text-destructive">
          {errors.length} error(s)
        </p>
        <Button variant="outline" size="sm" onClick={downloadErrors}>
          Download report
        </Button>
      </div>
      <ul className="max-h-32 overflow-y-auto text-xs space-y-1">
        {errors.slice(0, 20).map((e, i) => (
          <li key={i}>{e}</li>
        ))}
        {errors.length > 20 ? (
          <li className="text-muted-foreground">
            …and {errors.length - 20} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}
