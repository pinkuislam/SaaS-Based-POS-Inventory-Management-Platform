import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Bell } from "lucide-react";

export function DashboardNotifications({
  tenantSlug,
  notifications,
  unreadCount,
}: {
  tenantSlug: string;
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }[];
  unreadCount: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </CardTitle>
        <Link
          href={tenantDashboardPath(tenantSlug, "/notifications")}
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm border rounded-md p-3 ${!n.isRead ? "bg-muted/50 border-primary/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{n.title}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {n.type}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2">
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
