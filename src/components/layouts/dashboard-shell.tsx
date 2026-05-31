"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
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
} from "lucide-react";
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

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  { title: "Products", href: "/dashboard/products", icon: Package },
  { title: "Categories", href: "/dashboard/categories", icon: Tags },
  { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { title: "Sales", href: "/dashboard/sales", icon: Receipt },
  { title: "Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  { title: "Expenses", href: "/dashboard/expenses", icon: CreditCard },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Users & Roles", href: "/dashboard/users", icon: UserCog },
  { title: "Branches", href: "/dashboard/branches", icon: Building2 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarContent() {
  const { data: session } = useSession();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link href="/dashboard" className="flex flex-col gap-1">
          <span className="text-lg font-bold tracking-tight">InventoryPOS</span>
          <span className="text-xs text-muted-foreground truncate">
            {session?.user?.tenantName || "Business"}
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={navItems} />
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4">
          <Sheet>
            <SheetTrigger
              className="lg:hidden inline-flex items-center justify-center rounded-lg hover:bg-muted h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

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
                onClick={() => (window.location.href = "/dashboard/settings")}
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
