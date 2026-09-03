import type { ReactNode } from "react";
import { requireRole } from "@/lib/authz";

export default async function MyTeamLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["manager"]);
  return children;
}
