import { StorageUsagePanel } from "@/components/settings/storage-usage-panel";
import { FileManager } from "@/components/files/file-manager";

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Files & Storage</h1>
        <p className="text-muted-foreground">
          View uploaded files, monitor storage usage, and remove unused files
        </p>
      </div>

      <StorageUsagePanel />
      <FileManager />
    </div>
  );
}
