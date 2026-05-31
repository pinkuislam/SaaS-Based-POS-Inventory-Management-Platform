"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TenantEditDialog,
  type TenantEditData,
} from "@/components/admin/tenant-edit-dialog";
import { Pencil } from "lucide-react";

export function TenantEditButton({
  tenant,
  packages,
}: {
  tenant: TenantEditData;
  packages: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <TenantEditDialog
        tenant={tenant}
        packages={packages}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
