import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { provisionTenantDatabase } from "@/lib/tenant-database";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await provisionTenantDatabase(id);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Provision DB error:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to provision database",
      },
      { status: 500 }
    );
  }
}
