import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: { tenantId: session.user.tenantId },
    include: { category: true },
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
  const { title, amount, categoryId, expenseDate, notes, categoryName } = body;

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

  const expense = await prisma.expense.create({
    data: {
      tenantId,
      title: title.trim(),
      amount,
      categoryId: finalCategoryId,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      notes,
    },
    include: { category: true },
  });

  return NextResponse.json(expense);
}
