import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "category";
  const tenantId = session.user.tenantId;

  if (type === "brand") {
    return NextResponse.json(
      await prisma.brand.findMany({ where: { tenantId }, orderBy: { name: "asc" } })
    );
  }
  if (type === "unit") {
    return NextResponse.json(
      await prisma.unit.findMany({ where: { tenantId }, orderBy: { name: "asc" } })
    );
  }

  return NextResponse.json(
    await prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    })
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const body = await request.json();
  const { type, name, code, shortName, parentId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (type === "brand") {
    const brand = await prisma.brand.create({
      data: {
        tenantId,
        name: name.trim(),
        description: body.description?.trim() || null,
      },
    });
    return NextResponse.json(brand);
  }

  if (type === "unit") {
    const unit = await prisma.unit.create({
      data: {
        tenantId,
        name: name.trim(),
        shortName: shortName?.trim(),
        unitType: body.unitType?.trim() || null,
      },
    });
    return NextResponse.json(unit);
  }

  const category = await prisma.productCategory.create({
    data: {
      tenantId,
      name: name.trim(),
      code: code?.trim() || null,
      parentId: parentId || null,
    },
  });
  return NextResponse.json(category);
}
