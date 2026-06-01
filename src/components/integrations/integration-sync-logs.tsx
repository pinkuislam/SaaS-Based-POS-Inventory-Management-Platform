"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type SyncLog = {
  id: string;
  action: string;
  details: string | null;
  userName: string | null;
  createdAt: string;
};

export function IntegrationSyncLogs() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorsOnly, setErrorsOnly] = useState(false);

  async function load() {
    setLoading(true);
    const q = errorsOnly ? "?errorsOnly=true" : "";
    const res = await fetch(`/api/integrations/sync-logs${q}`);
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [errorsOnly]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Sync History</CardTitle>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={errorsOnly}
              onChange={(e) => setErrorsOnly(e.target.checked)}
            />
            Errors only
          </label>
          <Button variant="ghost" size="icon" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sync activity yet. Run a product or order sync to see logs here.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex justify-between gap-2 border rounded p-2 text-sm"
              >
                <div>
                  <Badge variant="outline" className="text-xs mb-1">
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                  <p>{log.details || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.userName || "System"} · {formatDate(log.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
