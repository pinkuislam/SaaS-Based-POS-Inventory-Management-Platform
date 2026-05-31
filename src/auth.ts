import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const loginType = (credentials.loginType as string) || "tenant";

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.branchId = user.branchId;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.userType = token.userType as string;
        session.user.tenantId = token.tenantId as string | null;
        session.user.tenantSlug = token.tenantSlug as string | null;
        session.user.tenantName = token.tenantName as string | null;
        session.user.branchId = token.branchId as string | null;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
