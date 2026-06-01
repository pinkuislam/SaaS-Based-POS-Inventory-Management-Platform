"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Trash2, CheckCheck } from "lucide-react";
import { FormSelect2 } from "@/components/ui/form-field";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "low_stock", label: "Low stock" },
  { value: "customer_due", label: "Customer due" },
  { value: "supplier_due", label: "Supplier due" },
  { value: "purchase_due", label: "Purchase due" },
  { value: "sale_return", label: "Sale returns" },
  { value: "subscription", label: "Subscription" },
  { value: "announcement", label: "Announcements" },
];

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  async function load() {
    const q = typeFilter !== "all" ? `?type=${typeFilter}` : "";
    const res = await fetch(`/api/notifications${q}`);
    const data = await res.json();
    if (res.ok) setItems(data.notifications);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [typeFilter]);

  async function markAllRead() {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (res.ok) {
      notify.success("All marked as read");
      load();
    }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function remove(id: string) {
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      notify.success("Notification deleted");
      load();
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading notifications...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <FormSelect2
          label="Filter by type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_OPTIONS}
          className="w-[200px]"
        />
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all read
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        items.map((n) => (
          <Card key={n.id} className={n.isRead ? "opacity-75" : ""}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {n.title}
                  {!n.isRead && <Badge>New</Badge>}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(n.createdAt)} · {n.type}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    Read
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => remove(n.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{n.message}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
