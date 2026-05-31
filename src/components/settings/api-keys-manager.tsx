"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { apiKeySchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
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
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    { name: "" },
    apiKeySchema
  );

  async function loadKeys() {
    const res = await fetch("/api/tenant/api-keys");
    if (res.ok) setKeys(await res.json());
  }

  useEffect(() => {
    if (hasApiAccess) loadKeys();
  }, [hasApiAccess]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tenant/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      setNewKey(resData.apiKey);
      reset();
      notify.success("API key created — copy it now");
      loadKeys();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    const confirmed = await confirmDelete(
      "Revoke API key?",
      "Applications using this key will stop working immediately."
    );
    if (!confirmed) return;
    const res = await fetch(`/api/tenant/api-keys?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      notify.success("Key revoked");
      loadKeys();
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      notify.success("Copied to clipboard");
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

      <form onSubmit={createKey} className="flex gap-2 items-end" noValidate>
        <FormField
          label="Key name"
          htmlFor="keyName"
          required
          error={fieldError("name")}
          className="flex-1"
        >
          <FormInput
            id="keyName"
            name="keyName"
            value={values.name}
            error={fieldError("name")}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. WooCommerce sync"
          />
        </FormField>
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
