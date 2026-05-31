import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { getTenantSession } from "@/lib/tenant";
import { tenantHomePath } from "@/lib/tenant-path";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const session = await getTenantSession();
  const sessionSlug = session.user.tenantSlug;

  if (sessionSlug && sessionSlug !== tenant) {
    redirect(tenantHomePath(sessionSlug));
  }

  return <DashboardShell tenantSlug={tenant}>{children}</DashboardShell>;
}
