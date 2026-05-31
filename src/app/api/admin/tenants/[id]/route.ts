import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status },
  });

  if (status === "ACTIVE" && !tenant.dbProvisioned && process.env.AUTO_PROVISION_TENANT_DB === "true") {
    try {
      const { provisionTenantDatabase } = await import("@/lib/tenant-database");
      await provisionTenantDatabase(id);
    } catch (e) {
      console.error("Auto provision failed:", e);
    }
  }

  return NextResponse.json(tenant);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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

  await prisma.tenant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
