import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("show") === "all";
  const branchId = searchParams.get("branchId");
  const categoryId = searchParams.get("categoryId");

  const expenses = await prisma.expense.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(showAll ? {} : { deletedAt: null }),
      ...(branchId ? { branchId } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true, branch: { select: { name: true } } },
    orderBy: { expenseDate: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const body = await request.json();
  const {
    title,
    amount,
    categoryId,
    expenseDate,
    notes,
    categoryName,
    branchId,
    paymentMethod,
  } = body;

  if (!title?.trim() || amount === undefined) {
    return NextResponse.json(
      { error: "Title and amount are required" },
      { status: 400 }
    );
  }

  let finalCategoryId = categoryId || null;

  if (categoryName?.trim() && !categoryId) {
    const cat = await prisma.expenseCategory.upsert({
      where: {
        tenantId_name: { tenantId, name: categoryName.trim() },
      },
      update: {},
      create: { tenantId, name: categoryName.trim() },
    });
    finalCategoryId = cat.id;
  }

  if (branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId, deletedAt: null },
    });
    if (!branch) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
    }
  }

  const expense = await prisma.expense.create({
    data: {
      tenantId,
      branchId: branchId || null,
      title: title.trim(),
      amount,
      categoryId: finalCategoryId,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMethod: paymentMethod || "cash",
      notes,
    },
    include: { category: true },
  });

  return NextResponse.json(expense);
}
