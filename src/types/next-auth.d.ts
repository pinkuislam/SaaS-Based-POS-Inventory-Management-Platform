import "next-auth";

declare module "next-auth" {
  interface User {
    userType?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    tenantName?: string | null;
    branchId?: string | null;
    role?: string;
    permissions?: string[];
  }

  interface Session {
    user: User & {
      id: string;
      userType?: string;
      tenantId?: string | null;
      tenantSlug?: string | null;
      tenantName?: string | null;
      branchId?: string | null;
      role?: string;
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    tenantName?: string | null;
    branchId?: string | null;
    role?: string;
    permissions?: string[];
  }
}
