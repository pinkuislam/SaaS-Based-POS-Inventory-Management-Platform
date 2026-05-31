import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Platform profile, security, and payment gateways
        </p>
      </div>
      <PlatformSettingsForm />
    </div>
  );
}
