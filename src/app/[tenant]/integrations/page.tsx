import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WooCommerceConnect } from "@/components/integrations/woocommerce-connect";
import { tenantHomePath } from "@/lib/tenant-path";

export default async function TenantIntegrationsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const session = await auth();
  const { tenant: tenantSlug } = await params;

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  if (session.user.tenantSlug && session.user.tenantSlug !== tenantSlug) {
    redirect(tenantHomePath(session.user.tenantSlug));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to sync products, stock, and orders
        </p>
      </div>
      <WooCommerceConnect />
    </div>
  );
}
