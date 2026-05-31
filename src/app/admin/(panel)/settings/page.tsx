import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Payment gateways and platform configuration
        </p>
      </div>
      <PaymentSettingsForm />
    </div>
  );
}
