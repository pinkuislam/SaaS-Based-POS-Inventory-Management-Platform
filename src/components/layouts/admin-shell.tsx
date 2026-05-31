"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  HeadphonesIcon,
  Settings,
  LogOut,
  Menu,
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

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Tenants", href: "/admin/tenants", icon: Building2 },
  { title: "Packages", href: "/admin/packages", icon: Package },
  { title: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Billing", href: "/admin/billing", icon: CreditCard },
  { title: "Support", href: "/admin/support", icon: HeadphonesIcon },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link href="/admin/dashboard" className="flex flex-col gap-1">
          <span className="text-lg font-bold tracking-tight">
            Platform Admin
          </span>
          <span className="text-xs text-muted-foreground">SaaS Control Panel</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={navItems} />
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
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
                  {session?.user?.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">
                {session?.user?.name}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
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
