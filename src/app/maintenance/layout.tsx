import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance — InventoryPOS",
  robots: { index: false, follow: false },
};

/** Lightweight layout: no session provider (avoids auth fetch while site is down). */
export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
