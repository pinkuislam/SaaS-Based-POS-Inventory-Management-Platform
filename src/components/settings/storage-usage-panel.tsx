"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

type StorageData = {
  usedMb: number;
  limitMb: number;
  fileCount: number;
  percentUsed: number;
};

export function StorageUsagePanel() {
  const [data, setData] = useState<StorageData | null>(null);

  useEffect(() => {
    fetch("/api/tenant/storage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">Loading storage usage...</p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="h-5 w-5" />
          Storage Usage
        </CardTitle>
        <CardDescription>
          Product images and uploaded files for your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>
            {data.usedMb} MB used of {data.limitMb} MB
          </span>
          <span className="text-muted-foreground">
            {data.fileCount} file(s)
          </span>
        </div>
        <Progress value={data.percentUsed} />
        {data.percentUsed >= 90 && (
          <p className="text-sm text-destructive">
            Storage is almost full. Remove unused images or upgrade your plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
