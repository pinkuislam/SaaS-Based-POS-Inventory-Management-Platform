"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { maintenanceSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const initial = {
  maintenanceMode: false,
  maintenanceMessage: "",
};

export function MaintenancePanel() {
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, setValues } =
    useValidatedForm(initial, maintenanceSchema);

  useEffect(() => {
    fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then((d) => {
        setValues({
          maintenanceMode: !!d.maintenanceMode,
          maintenanceMessage: d.maintenanceMessage || "",
        });
      })
      .catch(() => {});
  }, [setValues]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode: data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Maintenance settings updated");
    } catch {
      notify.error("Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4" noValidate>
          <div className="flex items-center gap-2">
            <Checkbox
              id="maint"
              checked={form.maintenanceMode}
              onCheckedChange={(v) => setField("maintenanceMode", !!v)}
            />
            <Label htmlFor="maint">Enable maintenance mode</Label>
          </div>
          <FormField
            label="Message"
            htmlFor="maintenanceMessage"
            error={fe("maintenanceMessage")}
          >
            <FormTextarea
              id="maintenanceMessage"
              value={form.maintenanceMessage}
              error={fe("maintenanceMessage")}
              onChange={(e) => setField("maintenanceMessage", e.target.value)}
              rows={4}
            />
          </FormField>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
