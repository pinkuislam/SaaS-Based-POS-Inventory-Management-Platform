import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      package: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 5, include: { package: true } },
      _count: {
        select: {
          users: true,
          branches: true,
          products: true,
          sales: true,
          customers: true,
          suppliers: true,
          supportTickets: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recentLogins = await prisma.loginLog.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ tenant, recentLogins });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.name !== undefined) data.name = body.name;
  if (body.ownerName !== undefined) data.ownerName = body.ownerName;
  if (body.email !== undefined) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.address !== undefined) data.address = body.address;
  if (body.packageId !== undefined) data.packageId = body.packageId || null;
  if (body.loginBlocked !== undefined) data.loginBlocked = body.loginBlocked;

  if (body.slug !== undefined) {
    const normalizedSlug = String(body.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const existing = await prisma.tenant.findFirst({
      where: { slug: normalizedSlug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
    }
    data.slug = normalizedSlug;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
  const tenant = await prisma.tenant.update({
    where: { id },
    data,
  });

  if (
    body.status === "ACTIVE" &&
    !tenant.dbProvisioned &&
    process.env.AUTO_PROVISION_TENANT_DB === "true"
  ) {
    try {
      const { provisionTenantDatabase } = await import("@/lib/tenant-database");
      await provisionTenantDatabase(id);
    } catch (e) {
      console.error("Auto provision failed:", e);
    }
  }

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "UPDATE",
    module: "tenants",
    details: `Updated tenant ${tenant.name}`,
    metadata: { tenantId: id, changes: body },
  });

  return NextResponse.json(tenant);
  } catch (e) {
    console.error("Tenant update failed:", e);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { permanent } = await request.json().catch(() => ({}));

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (tenant.slug === "demo-shop") {
    return NextResponse.json(
      { error: "Cannot delete the demo tenant" },
      { status: 400 }
    );
  }

  try {
    if (permanent) {
      const { deleteTenantPermanently, prismaDeleteErrorMessage } = await import(
        "@/lib/admin/delete-tenant"
      );
      await deleteTenantPermanently(id);
    } else {
      await prisma.tenant.update({
        where: { id },
        data: { deletedAt: new Date(), status: "INACTIVE" },
      });
    }

    await logPlatformActivity({
      adminId: auth.session.user.id,
      adminName: auth.session.user.name || undefined,
      action: permanent ? "DELETE" : "SOFT_DELETE",
      module: "tenants",
      details: `${permanent ? "Deleted" : "Archived"} tenant ${tenant.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const { prismaDeleteErrorMessage } = await import("@/lib/admin/delete-tenant");
    console.error("Tenant delete failed:", e);
    return NextResponse.json(
      { error: prismaDeleteErrorMessage(e) },
      { status: 500 }
    );
  }
}
