"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  ShoppingBag,
  Users,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Building2,
  Receipt,
  UserCog,
  CreditCard,
  Tags,
  Plug,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ImpersonationBanner } from "@/components/layouts/impersonation-banner";
import { canAccessRoute } from "@/lib/route-permissions";
import { tenantDashboardPath, tenantHomePath } from "@/lib/tenant-path";

function buildNavItems(tenantSlug: string): NavItem[] {
  const d = (sub: string) => tenantDashboardPath(tenantSlug, sub);
  return [
    { title: "Dashboard", href: tenantHomePath(tenantSlug), icon: LayoutDashboard },
    { title: "POS", href: d("/pos"), icon: ShoppingCart },
    { title: "Products", href: d("/products"), icon: Package },
    { title: "Categories", href: d("/categories"), icon: Tags },
    { title: "Inventory", href: d("/inventory"), icon: Warehouse },
    { title: "Sales", href: d("/sales"), icon: Receipt },
    { title: "Purchases", href: d("/purchases"), icon: ShoppingBag },
    { title: "Customers", href: d("/customers"), icon: Users },
    { title: "Suppliers", href: d("/suppliers"), icon: Truck },
    { title: "Expenses", href: d("/expenses"), icon: CreditCard },
    { title: "Reports", href: d("/reports"), icon: BarChart3 },
    { title: "Users & Roles", href: d("/users"), icon: UserCog },
    { title: "Branches", href: d("/branches"), icon: Building2 },
    { title: "Integrations", href: d("/integrations"), icon: Plug },
    { title: "Settings", href: d("/settings"), icon: Settings },
  ];
}

function SidebarContent({ tenantSlug }: { tenantSlug: string }) {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const navItems = buildNavItems(tenantSlug);
  const visibleNav = navItems.filter((item) =>
    canAccessRoute(item.href, permissions)
  );
  const home = tenantHomePath(tenantSlug);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link href={home} className="flex flex-col gap-1">
          <span className="text-lg font-bold tracking-tight">InventoryPOS</span>
          <span className="text-xs text-muted-foreground truncate">
            {session?.user?.tenantName || "Business"}
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={visibleNav} />
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {session?.user?.role}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  tenantSlug,
  children,
}: {
  tenantSlug: string;
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const settingsPath = tenantDashboardPath(tenantSlug, "/settings");

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <SidebarContent tenantSlug={tenantSlug} />
      </aside>

      <div className="flex flex-1 flex-col">
        <ImpersonationBanner />
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4">
          <Sheet>
            <SheetTrigger
              className="lg:hidden inline-flex items-center justify-center rounded-lg hover:bg-muted h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent tenantSlug={tenantSlug} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <NotificationBell tenantSlug={tenantSlug} />

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg hover:bg-muted px-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">
                {session?.user?.name}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                {session?.user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = settingsPath;
                }}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
