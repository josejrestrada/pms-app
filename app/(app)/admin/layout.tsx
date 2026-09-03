import type { ReactNode } from "react";
import { requireRole } from "@/lib/authz";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["hr_admin"]);
  return children;
}
