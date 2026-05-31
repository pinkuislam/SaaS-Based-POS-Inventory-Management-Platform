import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
        tenantSlug: { label: "Tenant Slug", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const loginType = (credentials.loginType as string) || "tenant";
        const expectedSlug = (credentials.tenantSlug as string) || "";

        if (loginType === "admin") {
          const admin = await prisma.superAdmin.findUnique({
            where: { email },
          });
          if (!admin) return null;
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            userType: "SUPER_ADMIN",
            tenantId: null,
            tenantSlug: null,
            role: "Super Admin",
            permissions: ["*"],
          };
        }

        const user = await prisma.user.findFirst({
          where: { email, userType: "TENANT", isActive: true },
          include: {
            tenant: true,
            role: true,
          },
        });

        if (!user || !user.tenant) return null;
        if (user.tenant.status !== "ACTIVE") return null;

        if (expectedSlug && user.tenant.slug !== expectedSlug) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        const permissions = Array.isArray(user.role?.permissions)
          ? (user.role.permissions as string[])
          : [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: "TENANT",
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          tenantName: user.tenant.name,
          branchId: user.branchId,
          role: user.role?.name || "User",
          permissions,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      try {
        await prisma.loginLog.create({
          data: {
            email: user.email || "",
            userId: user.id,
            tenantId: user.tenantId || null,
            success: true,
          },
        });
      } catch {
        /* ignore log failures */
      }
    },
  },
});
