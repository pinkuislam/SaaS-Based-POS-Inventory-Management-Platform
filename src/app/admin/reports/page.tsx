import { AdminReportsPanel } from "@/components/admin/admin-reports-panel";
import { ReportsExportButtons } from "@/components/admin/reports-export-buttons";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Platform-level revenue, tenants, and operations
          </p>
        </div>
        <ReportsExportButtons />
      </div>
      <AdminReportsPanel />
    </div>
  );
}
