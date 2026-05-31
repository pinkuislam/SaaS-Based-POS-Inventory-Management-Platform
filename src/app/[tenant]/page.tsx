import { redirect } from "next/navigation";
import { tenantHomePath } from "@/lib/tenant-path";

export default async function TenantIndexPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(tenantHomePath(tenant));
}
