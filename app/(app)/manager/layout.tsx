import type { ReactNode } from "react";
import { requireRole } from "@/lib/authz";

export default async function ManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["manager"]);
  return children;
}
