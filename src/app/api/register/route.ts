import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { DEFAULT_ROLES } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessName,
      slug,
      ownerName,
      email,
      phone,
      password,
      packageSlug,
    } = body;

    if (!businessName || !email || !password || !ownerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const finalSlug = slugify(slug || businessName);

    const existing = await prisma.tenant.findFirst({
      where: { OR: [{ slug: finalSlug }, { email }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Business slug or email already exists" },
        { status: 400 }
      );
    }

    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { slug: packageSlug || "starter" },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        ownerName: ownerName?.trim() || null,
        slug: finalSlug,
        email,
        phone,
        status: "PENDING",
        packageId: pkg?.id,
        dbName: `tenant_${finalSlug.replace(/-/g, "_")}`,
        settings: {
          business: {
            currency: "BDT",
            timezone: "Asia/Dhaka",
            invoicePrefix: "INV",
            businessType: "retail",
          },
          invoice: { prefix: "INV" },
          pos: {
            defaultTaxRate: 0,
            receiptFooter: "Thank you for your business!",
          },
        },
      },
    });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (pkg?.trialDays || 14));

    if (pkg) {
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          packageId: pkg.id,
          endDate,
          status: "TRIAL",
          amount: pkg.price,
        },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Main Branch",
        code: "MAIN",
        isMain: true,
      },
    });

    for (const [, roleData] of Object.entries(DEFAULT_ROLES)) {
      await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: roleData.name,
          permissions: roleData.permissions,
          isDefault: roleData.name === "Owner",
        },
      });
    }

    const ownerRole = await prisma.role.findUnique({
      where: { tenantId_name: { tenantId: tenant.id, name: "Owner" } },
    });

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: ownerRole?.id,
        branchId: branch.id,
        email,
        password: hashedPassword,
        name: ownerName,
        phone,
        userType: "TENANT",
      },
    });

    return NextResponse.json({ success: true, slug: finalSlug });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
