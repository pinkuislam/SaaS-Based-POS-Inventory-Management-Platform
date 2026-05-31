import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const loginType = searchParams.get("type") || "tenant";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (loginType === "admin") {
    const admin = await prisma.superAdmin.findUnique({ where: { email } });
    return NextResponse.json({ ok: !!admin });
  }

  const user = await prisma.user.findFirst({
    where: { email, userType: "TENANT" },
    include: { tenant: true },
  });

  if (!user?.tenant) {
    return NextResponse.json({ ok: false, reason: "not_found" });
  }

  if (user.tenant.status === "PENDING") {
    return NextResponse.json({
      ok: false,
      reason: "pending",
      message:
        "Your account is pending approval. Please wait for the platform administrator.",
    });
  }

  if (user.tenant.status === "SUSPENDED") {
    return NextResponse.json({
      ok: false,
      reason: "suspended",
      message: "Your business account has been suspended.",
    });
  }

  if (user.tenant.status === "EXPIRED") {
    return NextResponse.json({
      ok: false,
      reason: "expired",
      message: "Your subscription has expired. Please renew your plan.",
    });
  }

  if (!user.isActive) {
    return NextResponse.json({
      ok: false,
      reason: "inactive",
      message: "Your user account is deactivated.",
    });
  }

  return NextResponse.json({ ok: true });
}
