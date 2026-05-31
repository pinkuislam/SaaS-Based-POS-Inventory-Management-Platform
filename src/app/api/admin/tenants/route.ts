import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    name,
    ownerName,
    email,
    phone,
    address,
    slug,
    packageId,
    status = "PENDING",
    adminPassword,
    trialDays,
  } = body;

  if (!name || !email || !slug) {
    return NextResponse.json(
      { error: "Name, email, and slug are required" },
      { status: 400 }
    );
  }

  const normalizedSlug = String(slug)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  const existing = await prisma.tenant.findUnique({
    where: { slug: normalizedSlug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
  }

  const pkg = packageId
    ? await prisma.subscriptionPackage.findUnique({ where: { id: packageId } })
    : null;

  const password = await bcrypt.hash(adminPassword || "password123", 10);

  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        name,
        ownerName: ownerName || null,
        email,
        phone: phone || null,
        address: address || null,
        slug: normalizedSlug,
        status,
        packageId: pkg?.id || null,
        dbName: `tenant_${normalizedSlug.replace(/-/g, "_")}`,
      },
    });

    const ownerRole = await tx.role.create({
      data: {
        tenantId: created.id,
        name: "Owner",
        permissions: ["*"],
        isDefault: false,
      },
    });

    await tx.user.create({
      data: {
        tenantId: created.id,
        roleId: ownerRole.id,
        email,
        password,
        name: ownerName || name,
        phone: phone || null,
        userType: "TENANT",
        isActive: true,
      },
    });

    if (pkg) {
      const end = new Date();
      const days = trialDays ?? pkg.trialDays ?? 14;
      end.setDate(end.getDate() + days);
      await tx.subscription.create({
        data: {
          tenantId: created.id,
          packageId: pkg.id,
          endDate: end,
          status: days > 0 ? "TRIAL" : "ACTIVE",
          amount: pkg.price,
        },
      });
    }

    return created;
  });

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "CREATE",
    module: "tenants",
    details: `Created tenant ${tenant.name}`,
    metadata: { tenantId: tenant.id },
  });

  return NextResponse.json(tenant, { status: 201 });
}
