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
import { Download, RefreshCw } from "lucide-react";

type ActivityRow = {
  id: string;
  userName: string | null;
  action: string;
  module: string;
  details: string | null;
  createdAt: string;
};

const MODULES = [
  "all",
  "sales",
  "purchases",
  "products",
  "inventory",
  "customers",
  "suppliers",
  "payments",
  "users",
  "settings",
  "integrations",
  "subscription",
];

export function ActivityLogView({
  users = [],
}: {
  users?: { id: string; name: string }[];
}) {
  const [module, setModule] = useState("all");
  const [userId, setUserId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (module !== "all") params.set("module", module);
    if (userId !== "all") params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "200");
    try {
      const res = await fetch(`/api/tenant/activity?${params}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [module, userId, from, to]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (module !== "all") params.set("module", module);
    if (userId !== "all") params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("format", "csv");
    window.open(`/api/tenant/activity?${params}`, "_blank");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <FormSelect2
            label="Module"
            value={module}
            onChange={setModule}
            options={MODULES.map((m) => ({
              value: m,
              label: m === "all" ? "All modules" : m,
            }))}
            className="w-[160px]"
          />
          {users.length > 0 ? (
            <FormSelect2
              label="User"
              value={userId}
              onChange={setUserId}
              options={[
                { value: "all", label: "All users" },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
              className="w-[160px]"
            />
          ) : null}
          <FormField label="From" htmlFor="act-from">
            <FormInput
              id="act-from"
              type="date"
              className="w-[150px]"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </FormField>
          <FormField label="To" htmlFor="act-to">
            <FormInput
              id="act-to"
              type="date"
              className="w-[150px]"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </FormField>
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Apply
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity logs yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>{log.userName || "System"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.module}</Badge>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {log.details || "—"}
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
