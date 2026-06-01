"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

type LoginRow = {
  id: string;
  email: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function LoginLogView() {
  const [successFilter, setSuccessFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [logs, setLogs] = useState<LoginRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (successFilter === "true") params.set("success", "true");
    if (successFilter === "false") params.set("success", "false");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(`/api/tenant/login-logs?${params}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [successFilter, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <FormSelect2
            label="Status"
            value={successFilter}
            onChange={setSuccessFilter}
            options={[
              { value: "all", label: "All attempts" },
              { value: "true", label: "Successful" },
              { value: "false", label: "Failed" },
            ]}
            className="w-[160px]"
          />
          <FormField label="From" htmlFor="login-from">
            <FormInput
              id="login-from"
              type="date"
              className="w-[150px]"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </FormField>
          <FormField label="To" htmlFor="login-to">
            <FormInput
              id="login-to"
              type="date"
              className="w-[150px]"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </FormField>
          <Button onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No login logs yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? "Success" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.ip || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {log.userAgent || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
