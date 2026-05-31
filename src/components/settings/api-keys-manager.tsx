"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysManager({ hasApiAccess }: { hasApiAccess: boolean }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function loadKeys() {
    const res = await fetch("/api/tenant/api-keys");
    if (res.ok) setKeys(await res.json());
  }

  useEffect(() => {
    if (hasApiAccess) loadKeys();
  }, [hasApiAccess]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewKey(data.apiKey);
      setName("");
      toast.success("API key created — copy it now");
      loadKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key?")) return;
    const res = await fetch(`/api/tenant/api-keys?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Key revoked");
      loadKeys();
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success("Copied to clipboard");
    }
  }

  if (!hasApiAccess) {
    return (
      <p className="text-sm text-muted-foreground">
        REST API access is available on the Enterprise plan. Upgrade under
        Subscription & billing.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use <code>Authorization: Bearer inv_…</code> on{" "}
        <code>/api/v1/products</code> and <code>/api/v1/sales</code>. See{" "}
        <code>docs/REST-API.md</code>.
      </p>

      {newKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm dark:bg-amber-950/20">
          <p className="font-medium mb-1">New key (shown once):</p>
          <code className="break-all text-xs">{newKey}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={copyKey}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      )}

      <form onSubmit={createKey} className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Label>Key name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. WooCommerce sync"
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          <Plus className="h-4 w-4 mr-1" />
          Create key
        </Button>
      </form>

      {keys.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell>{k.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {k.keyPrefix}…
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never"}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeKey(k.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
